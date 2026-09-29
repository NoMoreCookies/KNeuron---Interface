import type { EEGSampleBatch } from "./models";

/**
 * Fixed-capacity circular EEG buffer.
 *
 * Stores the most recent N samples from the complete device stream without
 * continuously reallocating large arrays.
 */
export class EEGRingBuffer {
  private readonly values: Float64Array[];

  private readonly timestamps: Float64Array;

  private readonly sequenceNumbers: Float64Array;

  private readonly sourceSampleNumbers: Float64Array;

  private writeIndex = 0;

  private storedSamples = 0;

  constructor(
    private readonly channelCount: number,

    private readonly capacitySamples: number,
  ) {
    if (channelCount <= 0) {
      throw new Error("EEG ring buffer channel count must be greater than zero.");
    }

    if (capacitySamples <= 0) {
      throw new Error("EEG ring buffer capacity must be greater than zero.");
    }

    this.values = Array.from(
      {
        length: channelCount,
      },
      () => new Float64Array(capacitySamples),
    );

    this.timestamps = new Float64Array(capacitySamples);

    this.sequenceNumbers = new Float64Array(capacitySamples);

    this.sourceSampleNumbers = new Float64Array(capacitySamples);

    this.sourceSampleNumbers.fill(Number.NaN);
  }

  get size(): number {
    return this.storedSamples;
  }

  get capacity(): number {
    return this.capacitySamples;
  }

  /**
   * Appends one normalized EEG batch.
   */
  push(batch: Readonly<EEGSampleBatch>): void {
    this.validateBatch(batch);

    const sampleIntervalMs = 1000 / batch.sampleRateHz;

    for (let sampleOffset = 0; sampleOffset < batch.sampleCount; sampleOffset++) {
      const targetIndex = (this.writeIndex + sampleOffset) % this.capacitySamples;

      for (let channelIndex = 0; channelIndex < this.channelCount; channelIndex++) {
        this.values[channelIndex][targetIndex] = batch.values[channelIndex][sampleOffset];
      }

      this.timestamps[targetIndex] = batch.timestampStartMs + sampleOffset * sampleIntervalMs;

      this.sequenceNumbers[targetIndex] = batch.sequenceStart + sampleOffset;

      this.sourceSampleNumbers[targetIndex] =
        batch.sourceSampleNumberStart === undefined
          ? Number.NaN
          : batch.sourceSampleNumberStart + sampleOffset;
    }

    this.writeIndex = (this.writeIndex + batch.sampleCount) % this.capacitySamples;

    this.storedSamples = Math.min(this.capacitySamples, this.storedSamples + batch.sampleCount);
  }

  /**
   * Reads the newest samples in chronological order.
   *
   * `channelIndices` determines both which channels are returned and
   * their output ordering.
   */
  readLatest(
    requestedSampleCount: number,

    channelIndices: readonly number[],
  ): {
    sampleCount: number;
    timestampsMs: number[];
    sequenceNumbers: number[];
    sourceSampleNumbers?: number[];
    values: number[][];
  } {
    if (requestedSampleCount < 0) {
      throw new Error("Requested EEG sample count cannot be negative.");
    }

    for (const channelIndex of channelIndices) {
      if (channelIndex < 0 || channelIndex >= this.channelCount) {
        throw new Error(`EEG channel index ${channelIndex} is outside the ring buffer.`);
      }
    }

    const sampleCount = Math.min(requestedSampleCount, this.storedSamples);

    const timestampsMs: number[] = [];

    const sequenceNumbers: number[] = [];

    const sourceSampleNumbers: number[] = [];

    const values = channelIndices.map(() => [] as number[]);

    const startIndex =
      (this.writeIndex - sampleCount + this.capacitySamples) % this.capacitySamples;

    for (let offset = 0; offset < sampleCount; offset++) {
      const sourceIndex = (startIndex + offset) % this.capacitySamples;

      timestampsMs.push(this.timestamps[sourceIndex]);

      sequenceNumbers.push(this.sequenceNumbers[sourceIndex]);

      sourceSampleNumbers.push(this.sourceSampleNumbers[sourceIndex]);

      channelIndices.forEach((channelIndex, outputIndex) => {
        values[outputIndex].push(this.values[channelIndex][sourceIndex]);
      });
    }

    const hasCompleteSourceNumbers = sourceSampleNumbers.every(Number.isFinite);

    return {
      sampleCount,

      timestampsMs,

      sequenceNumbers,

      sourceSampleNumbers: hasCompleteSourceNumbers ? sourceSampleNumbers : undefined,

      values,
    };
  }

  clear(): void {
    this.writeIndex = 0;

    this.storedSamples = 0;

    this.sourceSampleNumbers.fill(Number.NaN);
  }

  private validateBatch(batch: Readonly<EEGSampleBatch>): void {
    if (batch.channelCount !== this.channelCount) {
      throw new Error(
        `EEG batch contains ${batch.channelCount} channels, expected ${this.channelCount}.`,
      );
    }

    if (batch.values.length !== this.channelCount) {
      throw new Error("EEG batch channel matrix does not match channelCount.");
    }

    if (batch.sampleCount <= 0) {
      throw new Error("EEG batch must contain at least one sample.");
    }

    if (batch.sampleRateHz <= 0) {
      throw new Error("EEG batch sample rate must be greater than zero.");
    }

    for (const channelValues of batch.values) {
      if (channelValues.length !== batch.sampleCount) {
        throw new Error("Every EEG channel must contain exactly sampleCount samples.");
      }
    }
  }
}
