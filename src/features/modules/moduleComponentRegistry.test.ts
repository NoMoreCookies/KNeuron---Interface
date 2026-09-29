import { describe, expect, it } from "vitest";

import { ModuleComponentRegistry } from "./moduleComponentRegistry";

import type { KNeuronModuleProps } from "./moduleDefinition";

function TestComponent(_props: KNeuronModuleProps) {
  return null;
}

describe("ModuleComponentRegistry", () => {
  it("starts empty", () => {
    const registry = new ModuleComponentRegistry();

    expect(registry.getAllIds()).toEqual([]);
  });

  it("registers a component", () => {
    const registry = new ModuleComponentRegistry();

    registry.register("test-module", TestComponent);

    expect(registry.has("test-module")).toBe(true);

    expect(registry.get("test-module")).toBe(TestComponent);
  });

  it("rejects duplicate component IDs", () => {
    const registry = new ModuleComponentRegistry();

    registry.register("test-module", TestComponent);

    expect(() => {
      registry.register("test-module", TestComponent);
    }).toThrow('Module component "test-module" is already registered.');
  });

  it("unregisters a component", () => {
    const registry = new ModuleComponentRegistry();

    registry.register("test-module", TestComponent);

    expect(registry.unregister("test-module")).toBe(true);

    expect(registry.has("test-module")).toBe(false);
  });
});
