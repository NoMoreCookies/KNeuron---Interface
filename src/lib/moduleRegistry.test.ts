import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestModuleManifest } from "../test/moduleFixtures";

import { ModuleRegistry } from "./moduleRegistry";

describe("ModuleRegistry", () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  it("starts empty", () => {
    expect(registry.getAll()).toEqual([]);
  });

  it("registers a valid module", () => {
    const manifest = createTestModuleManifest();

    const registered = registry.register(manifest);

    expect(registered.manifest).toEqual(manifest);
    expect(registered.status).toBe("available");
    expect(registered.error).toBeUndefined();
  });

  it("makes a registered module available through get()", () => {
    const manifest = createTestModuleManifest();

    registry.register(manifest);

    expect(registry.get(manifest.id)?.manifest).toEqual(manifest);
  });

  it("reports whether a module is registered", () => {
    const manifest = createTestModuleManifest();

    expect(registry.has(manifest.id)).toBe(false);

    registry.register(manifest);

    expect(registry.has(manifest.id)).toBe(true);
  });

  it("returns all registered modules", () => {
    registry.register(
      createTestModuleManifest({
        id: "module-one",
        name: "Module One",
        entryPoint: "/modules/module-one",
      }),
    );

    registry.register(
      createTestModuleManifest({
        id: "module-two",
        name: "Module Two",
        entryPoint: "/modules/module-two",
      }),
    );

    const modules = registry.getAll();

    expect(modules).toHaveLength(2);

    expect(modules.map((module) => module.manifest.id)).toEqual(["module-one", "module-two"]);
  });

  it("rejects duplicate module IDs", () => {
    const manifest = createTestModuleManifest();

    registry.register(manifest);

    expect(() => {
      registry.register(manifest);
    }).toThrow('Module with ID "test-module" is already registered.');
  });

  it("unregisters a module", () => {
    const manifest = createTestModuleManifest();

    registry.register(manifest);

    expect(registry.has(manifest.id)).toBe(true);

    registry.unregister(manifest.id);

    expect(registry.has(manifest.id)).toBe(false);
    expect(registry.get(manifest.id)).toBeUndefined();
  });

  it("updates module runtime state", () => {
    const manifest = createTestModuleManifest();

    registry.register(manifest);

    const updated = registry.setRuntimeState(manifest.id, "starting");

    expect(updated.status).toBe("starting");

    expect(registry.get(manifest.id)?.status).toBe("starting");
  });

  it("stores a runtime error", () => {
    const manifest = createTestModuleManifest();

    registry.register(manifest);

    const updated = registry.setRuntimeState(manifest.id, "error", "Test failure");

    expect(updated.status).toBe("error");
    expect(updated.error).toBe("Test failure");
  });

  it("rejects runtime updates for unknown modules", () => {
    expect(() => {
      registry.setRuntimeState("missing-module", "running");
    }).toThrow('Cannot update runtime state. Module "missing-module" is not registered.');
  });

  it("notifies subscribers when the registry changes", () => {
    const listener = vi.fn();

    const unsubscribe = registry.subscribe(listener);

    registry.register(createTestModuleManifest());

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();

    const unsubscribe = registry.subscribe(listener);

    unsubscribe();

    registry.register(createTestModuleManifest());

    expect(listener).not.toHaveBeenCalled();
  });
});
