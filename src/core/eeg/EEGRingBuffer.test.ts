import { describe, expect, it } from "vitest";

import { EEGRingBuffer } from "./EEGRingBuffer";

import type { EEGSampleBatch } from "./models";

function createBatch(sequenceStart: number): EEGSampleBatch {
  return {
    sequenceStart,

    timestampStartMs: 1000 + sequenceStart * 4,

    sampleRateHz: 250,

    sampleCount: 3,

    channelCount: 2,

    sourceSampleNumberStart: sequenceStart,

    values: [
      [sequenceStart, sequenceStart + 1, sequenceStart + 2],

      [100 + sequenceStart, 101 + sequenceStart, 102 + sequenceStart],
    ],
  };
}

describe("EEGRingBuffer", () => {
  it("stores EEG batches", () => {
    const buffer = new EEGRingBuffer(2, 10);

    buffer.push(createBatch(0));

    expect(buffer.size).toBe(3);
  });

  it("returns the newest samples", () => {
    const buffer = new EEGRingBuffer(2, 10);

    buffer.push(createBatch(0));

    buffer.push(createBatch(3));

    const latest = buffer.readLatest(4, [0, 1]);

    expect(latest.sampleCount).toBe(4);

    expect(latest.sequenceNumbers).toEqual([2, 3, 4, 5]);

    expect(latest.values[0]).toEqual([2, 3, 4, 5]);

    expect(latest.values[1]).toEqual([102, 103, 104, 105]);
  });

  it("keeps only the newest samples when capacity is exceeded", () => {
    const buffer = new EEGRingBuffer(2, 4);

    buffer.push(createBatch(0));

    buffer.push(createBatch(3));

    expect(buffer.size).toBe(4);

    const latest = buffer.readLatest(10, [0]);

    expect(latest.sequenceNumbers).toEqual([2, 3, 4, 5]);
  });

  it("allows selecting only required channels", () => {
    const buffer = new EEGRingBuffer(2, 10);

    buffer.push(createBatch(0));

    const latest = buffer.readLatest(3, [1]);

    expect(latest.values).toEqual([[100, 101, 102]]);
  });
});
