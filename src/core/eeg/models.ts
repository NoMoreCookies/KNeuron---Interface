import type { EEGChannelInfo } from "../devices/models/eeg";

/**
 * Raw normalized batch produced by an EEG device adapter.
 *
 * Data layout is channel-major:
 *
 * values[channelIndex][sampleIndex]
 *
 * Example:
 *
 * values[0] = all samples for channel 0
 * values[1] = all samples for channel 1
 */
export interface EEGSampleBatch {
  /**
   * Monotonic sample sequence number within the current stream session.
   */
  sequenceStart: number;

  /**
   * Timestamp of the first sample in milliseconds.
   */
  timestampStartMs: number;

  /**
   * Effective sampling frequency.
   */
  sampleRateHz: number;

  /**
   * Number of samples per channel in this batch.
   */
  sampleCount: number;

  /**
   * Number of channels contained in this batch.
   */
  channelCount: number;

  /**
   * Channel-major sample matrix.
   *
   * Shape:
   * [channelCount][sampleCount]
   */
  values: readonly (readonly number[])[];

  /**
   * Optional sample number reported by the underlying device/driver.
   *
   * This will later allow KNeuron to detect lost BrainAccess samples.
   */
  sourceSampleNumberStart?: number;
}

/**
 * Batch delivered to one EEGStreamService consumer.
 *
 * It may contain all device channels or only the subset requested
 * by the module.
 */
export interface EEGConsumerBatch {
  sequenceStart: number;

  timestampStartMs: number;

  sampleRateHz: number;

  sampleCount: number;

  channels: readonly Readonly<EEGChannelInfo>[];

  values: readonly (readonly number[])[];

  sourceSampleNumberStart?: number;
}

/**
 * Historical window returned from the shared EEG ring buffer.
 */
export interface EEGWindow {
  sampleRateHz: number;

  sampleCount: number;

  channels: readonly Readonly<EEGChannelInfo>[];

  /**
   * Timestamp for every returned sample.
   */
  timestampsMs: readonly number[];

  /**
   * KNeuron sequence number for every returned sample.
   */
  sequenceNumbers: readonly number[];

  /**
   * Native device sample numbers when available.
   */
  sourceSampleNumbers?: readonly number[];

  /**
   * Channel-major matrix.
   */
  values: readonly (readonly number[])[];
}

export type EEGSampleBatchListener = (batch: Readonly<EEGSampleBatch>) => void;

export type EEGConsumerBatchListener = (batch: Readonly<EEGConsumerBatch>) => void;
