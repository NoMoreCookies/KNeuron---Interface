import { describe, expect, it } from "vitest";

import { SimulationEEGAdapter } from "../adapters/simulation/SimulationEEGAdapter";

import { resolveEEGChannels } from "./channelSelection";

const SSVEP_CHANNELS = ["O1", "O2", "Oz", "PO3", "PO4", "POz"] as const;

describe("resolveEEGChannels", () => {
  it("resolves six SSVEP channels from a 32-channel device", async () => {
    const adapter = new SimulationEEGAdapter();

    const streamInfo = await adapter.getStreamInfo();

    const result = resolveEEGChannels(streamInfo, SSVEP_CHANNELS);

    expect(result.complete).toBe(true);

    expect(result.missingLabels).toEqual([]);

    expect(result.resolved).toHaveLength(6);

    expect(result.resolved.map((entry) => entry.channel.label)).toEqual([
      "O1",
      "O2",
      "Oz",
      "PO3",
      "PO4",
      "POz",
    ]);
  });

  it("reports missing channels", async () => {
    const adapter = new SimulationEEGAdapter();

    const streamInfo = await adapter.getStreamInfo();

    const result = resolveEEGChannels(streamInfo, ["O1", "O2", "PO5"]);

    expect(result.complete).toBe(false);

    expect(result.missingLabels).toEqual(["PO5"]);
  });

  it("matches channel labels case-insensitively", async () => {
    const adapter = new SimulationEEGAdapter();

    const streamInfo = await adapter.getStreamInfo();

    const result = resolveEEGChannels(streamInfo, ["o1", " oz ", "po3"]);

    expect(result.complete).toBe(true);

    expect(result.resolved.map((entry) => entry.channel.label)).toEqual(["O1", "Oz", "PO3"]);
  });
});
