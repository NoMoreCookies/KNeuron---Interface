import { afterEach, describe, expect, it } from "vitest";

import { moduleRegistry } from "../../lib/moduleRegistry";

import { moduleComponentRegistry } from "./moduleComponentRegistry";

import { registerModuleDefinition } from "./registerModuleDefinition";

import { createTestModuleManifest } from "../../test/moduleFixtures";

import type { KNeuronModuleProps } from "./moduleDefinition";

const MODULE_ID = "definition-test-module";

function TestComponent(_props: KNeuronModuleProps) {
  return null;
}

function cleanup(): void {
  if (moduleRegistry.has(MODULE_ID)) {
    moduleRegistry.unregister(MODULE_ID);
  }

  if (moduleComponentRegistry.has(MODULE_ID)) {
    moduleComponentRegistry.unregister(MODULE_ID);
  }
}

describe("registerModuleDefinition", () => {
  afterEach(() => {
    cleanup();
  });

  it("registers metadata and component together", () => {
    const manifest = createTestModuleManifest({
      id: MODULE_ID,
      entryPoint: `/modules/${MODULE_ID}`,
    });

    registerModuleDefinition({
      manifest,
      component: TestComponent,
    });

    expect(moduleRegistry.has(MODULE_ID)).toBe(true);

    expect(moduleComponentRegistry.has(MODULE_ID)).toBe(true);

    expect(moduleComponentRegistry.get(MODULE_ID)).toBe(TestComponent);
  });

  it("rejects duplicate definitions", () => {
    const manifest = createTestModuleManifest({
      id: MODULE_ID,
      entryPoint: `/modules/${MODULE_ID}`,
    });

    registerModuleDefinition({
      manifest,
      component: TestComponent,
    });

    expect(() => {
      registerModuleDefinition({
        manifest,
        component: TestComponent,
      });
    }).toThrow();
  });
});
