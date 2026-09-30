import { describe, expect, it } from "vitest";

import { DEFAULT_CORTEX_ELECTRODES } from "../models/defaultElectrodeLayout";

describe("DEFAULT_CORTEX_ELECTRODES", () => {
  it("contains the 32-channel simulation layout", () => {
    expect(DEFAULT_CORTEX_ELECTRODES).toHaveLength(32);
  });

  it("has unique labels", () => {
    const labels = DEFAULT_CORTEX_ELECTRODES.map((electrode) => electrode.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("contains the SSVEP occipital/parietal channels", () => {
    const labels = DEFAULT_CORTEX_ELECTRODES.map((electrode) => electrode.label);

    expect(labels).toEqual(expect.arrayContaining(["O1", "O2", "Oz", "PO3", "PO4", "POz"]));
  });
});
