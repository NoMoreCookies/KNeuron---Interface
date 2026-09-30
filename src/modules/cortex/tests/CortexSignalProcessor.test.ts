import { describe, expect, it } from "vitest";

import type { EEGConsumerBatch } from "../../../core/eeg";

import { CortexSignalProcessor, CORTEX_WARMUP_SECONDS } from "../eeg/CortexSignalProcessor";

const SAMPLE_RATE = 64;
const CHANNELS = [
  { index: 0, label: "O1", type: "eeg" as const, unit: "uV" as const },
  { index: 1, label: "O2", type: "eeg" as const, unit: "uV" as const },
];

function feedSeconds(
  processor: CortexSignalProcessor,
  seconds: number,
  startSample: number,
  amplitude = 1,
): number {
  const batchSize = 16;
  const totalSamples = Math.round(seconds * SAMPLE_RATE);
  let cursor = startSample;

  while (cursor < startSample + totalSamples) {
    const count = Math.min(batchSize, startSample + totalSamples - cursor);
    const values = CHANNELS.map((_, channelIndex) =>
      Array.from({ length: count }, (_, offset) => {
        const sample = cursor + offset;
        const time = sample / SAMPLE_RATE;
        return amplitude * Math.sin(2 * Math.PI * 10 * time + channelIndex * 0.2);
      }),
    );

    const batch: EEGConsumerBatch = {
      sequenceStart: cursor,
      sourceSampleNumberStart: cursor,
      timestampStartMs: (cursor / SAMPLE_RATE) * 1000,
      sampleRateHz: SAMPLE_RATE,
      sampleCount: count,
      channels: CHANNELS,
      values,
    };

    processor.processBatch(batch);
    cursor += count;
  }

  return cursor;
}

describe("CortexSignalProcessor", () => {
  it("remains idle until the experience is started", () => {
    const processor = new CortexSignalProcessor(SAMPLE_RATE, ["O1", "O2"]);

    feedSeconds(processor, 2, 0);

    const snapshot = processor.snapshot();
    expect(snapshot.started).toBe(false);
    expect(snapshot.phase).toBe("idle");
    expect(snapshot.fastReady).toBe(false);
  });

  it("starts with a three-second filter warm-up", () => {
    const processor = new CortexSignalProcessor(SAMPLE_RATE, ["O1", "O2"]);
    processor.startCalibration();

    feedSeconds(processor, CORTEX_WARMUP_SECONDS / 2, 0);

    const snapshot = processor.snapshot();
    expect(snapshot.phase).toBe("warmup");
    expect(snapshot.warmupProgress).toBeGreaterThan(0.4);
    expect(snapshot.warmupProgress).toBeLessThan(0.6);
    expect(snapshot.fastCalibrationProgress).toBe(0);
  });

  it("freezes the FAST baseline after calibration and reacts to stronger activity", () => {
    const processor = new CortexSignalProcessor(SAMPLE_RATE, ["O1", "O2"]);
    processor.startCalibration();

    let cursor = feedSeconds(processor, 14, 0, 1);
    let snapshot = processor.snapshot();

    expect(snapshot.fastReady).toBe(true);
    expect(snapshot.fastCalibrationProgress).toBe(1);

    cursor = feedSeconds(processor, 1, cursor, 4);
    snapshot = processor.snapshot();

    expect(Math.max(...Object.values(snapshot.fastActivityByLabel))).toBeGreaterThan(0.1);
    expect(cursor).toBeGreaterThan(0);
  });

  it("builds and freezes the band baseline", () => {
    const processor = new CortexSignalProcessor(SAMPLE_RATE, ["O1", "O2"]);
    processor.startCalibration();

    feedSeconds(processor, 26, 0, 1);

    const snapshot = processor.snapshot();
    expect(snapshot.bandWindowProgress).toBe(1);
    expect(snapshot.bandReady).toBe(true);
    expect(snapshot.bandCalibrationProgress).toBe(1);
  });

  it("recalibration resets frozen baselines", () => {
    const processor = new CortexSignalProcessor(SAMPLE_RATE, ["O1", "O2"]);
    processor.startCalibration();

    feedSeconds(processor, 14, 0, 1);
    expect(processor.snapshot().fastReady).toBe(true);

    processor.startCalibration();

    const snapshot = processor.snapshot();
    expect(snapshot.phase).toBe("warmup");
    expect(snapshot.fastReady).toBe(false);
    expect(snapshot.bandReady).toBe(false);
    expect(snapshot.fastCalibrationProgress).toBe(0);
  });
});
