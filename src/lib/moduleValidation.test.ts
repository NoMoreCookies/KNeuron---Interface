import { describe, expect, it } from "vitest";

import { createTestModuleManifest } from "../test/moduleFixtures";

import { validateModuleManifest } from "./moduleValidation";

import type { KNeuronModuleManifest } from "../types/module";

describe("validateModuleManifest", () => {
  it("accepts a valid module manifest", () => {
    const manifest = createTestModuleManifest();

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an unsupported schema version", () => {
    const manifest = {
      ...createTestModuleManifest(),
      schemaVersion: 999,
    } as unknown as KNeuronModuleManifest;

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain("Unsupported manifest schema version: 999.");
  });

  it("rejects an invalid module ID", () => {
    const manifest = createTestModuleManifest({
      id: "Invalid Module ID",
      entryPoint: "/modules/Invalid Module ID",
    });

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain(
      "Module ID must contain only lowercase letters, numbers and hyphens.",
    );
  });

  it("rejects an empty module name", () => {
    const manifest = createTestModuleManifest({
      name: "",
    });

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain("Module name is required.");
  });

  it("rejects an empty version", () => {
    const manifest = createTestModuleManifest({
      version: "",
    });

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain("Module version is required.");
  });

  it("rejects an empty description", () => {
    const manifest = createTestModuleManifest({
      description: "",
    });

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain("Module description is required.");
  });

  it("rejects an unsupported category", () => {
    const manifest = {
      ...createTestModuleManifest(),
      category: "INVALID_CATEGORY",
    } as unknown as KNeuronModuleManifest;

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain("Unsupported module category: INVALID_CATEGORY.");
  });

  it("rejects an entry point that does not match the module ID", () => {
    const manifest = createTestModuleManifest({
      id: "cortex-3d",
      entryPoint: "/modules/wrong-module",
    });

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain('Module entry point must be "/modules/cortex-3d".');
  });

  it("collects multiple validation errors at once", () => {
    const manifest = {
      ...createTestModuleManifest(),
      name: "",
      version: "",
      description: "",
      category: "INVALID",
    } as unknown as KNeuronModuleManifest;

    const result = validateModuleManifest(manifest);

    expect(result.valid).toBe(false);

    expect(result.errors.length).toBeGreaterThanOrEqual(4);

    expect(result.errors).toContain("Module name is required.");

    expect(result.errors).toContain("Module version is required.");

    expect(result.errors).toContain("Module description is required.");
  });
});
