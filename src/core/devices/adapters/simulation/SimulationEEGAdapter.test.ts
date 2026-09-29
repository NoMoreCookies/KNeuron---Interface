import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SimulationEEGAdapter } from "./SimulationEEGAdapter";

describe("SimulationEEGAdapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts disconnected", () => {
    const adapter = new SimulationEEGAdapter();

    expect(adapter.getStatus().state).toBe("disconnected");
  });

  it("exposes a 250 Hz 32-channel EEG stream", async () => {
    const adapter = new SimulationEEGAdapter();

    const info = await adapter.getStreamInfo();

    expect(info.sampleRateHz).toBe(250);

    expect(info.channels).toHaveLength(32);
  });

  it("requires connection before streaming", async () => {
    const adapter = new SimulationEEGAdapter();

    await expect(adapter.startStream()).rejects.toThrow(
      "Simulation EEG must be connected before streaming can start.",
    );
  });

  it("starts and stops streaming", async () => {
    const adapter = new SimulationEEGAdapter();

    await adapter.connect();

    await adapter.startStream();

    expect(adapter.isStreaming()).toBe(true);

    await adapter.stopStream();

    expect(adapter.isStreaming()).toBe(false);
  });

  it("produces 32-channel sample batches", async () => {
    const adapter = new SimulationEEGAdapter();

    await adapter.connect();

    const listener = vi.fn();

    adapter.subscribeSamples(listener);

    await adapter.startStream();

    vi.advanceTimersByTime(40);

    expect(listener).toHaveBeenCalled();

    const batch = listener.mock.calls[0][0];

    expect(batch.sampleRateHz).toBe(250);

    expect(batch.channelCount).toBe(32);

    expect(batch.sampleCount).toBe(10);

    expect(batch.values).toHaveLength(32);

    expect(batch.values[0]).toHaveLength(10);
  });

  it("automatically stops streaming during disconnect", async () => {
    const adapter = new SimulationEEGAdapter();

    await adapter.connect();

    await adapter.startStream();

    await adapter.disconnect();

    expect(adapter.isStreaming()).toBe(false);

    expect(adapter.getStatus().state).toBe("disconnected");
  });
});
