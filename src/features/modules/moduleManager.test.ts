import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { moduleRegistry } from "../../lib/moduleRegistry";

import { createTestModuleManifest } from "../../test/moduleFixtures";

import { moduleManager } from "./moduleManager";

const TEST_MODULE_ID = "lifecycle-test-module";

function registerTestModule(): void {
  moduleRegistry.register(
    createTestModuleManifest({
      id: TEST_MODULE_ID,
      name: "Lifecycle Test Module",
      entryPoint: `/modules/${TEST_MODULE_ID}`,
    }),
  );
}

function removeTestModule(): void {
  if (moduleRegistry.has(TEST_MODULE_ID)) {
    moduleRegistry.unregister(TEST_MODULE_ID);
  }
}

describe("ModuleManager", () => {
  beforeEach(() => {
    removeTestModule();
    registerTestModule();
  });

  afterEach(() => {
    removeTestModule();
  });

  it("starts an available module", async () => {
    expect(moduleRegistry.get(TEST_MODULE_ID)?.status).toBe("available");

    const result = await moduleManager.start(TEST_MODULE_ID);

    expect(result.status).toBe("running");

    expect(moduleRegistry.get(TEST_MODULE_ID)?.status).toBe("running");
  });

  it("keeps an already running module running", async () => {
    await moduleManager.start(TEST_MODULE_ID);

    const result = await moduleManager.start(TEST_MODULE_ID);

    expect(result.status).toBe("running");

    expect(moduleRegistry.get(TEST_MODULE_ID)?.status).toBe("running");
  });

  it("stops a running module", async () => {
    await moduleManager.start(TEST_MODULE_ID);

    const result = moduleManager.stop(TEST_MODULE_ID);

    expect(result.status).toBe("available");

    expect(moduleRegistry.get(TEST_MODULE_ID)?.status).toBe("available");
  });

  it("treats stopping an available module as a no-op", () => {
    const result = moduleManager.stop(TEST_MODULE_ID);

    expect(result.status).toBe("available");
  });

  it("rejects starting a disabled module", async () => {
    moduleRegistry.setRuntimeState(TEST_MODULE_ID, "disabled");

    await expect(moduleManager.start(TEST_MODULE_ID)).rejects.toThrow(
      `Module "${TEST_MODULE_ID}" is disabled.`,
    );
  });

  it("records a runtime failure for a running module", async () => {
    await moduleManager.start(TEST_MODULE_ID);

    const result = moduleManager.fail(TEST_MODULE_ID, "Simulated failure");

    expect(result.status).toBe("error");
    expect(result.error).toBe("Simulated failure");

    const registered = moduleRegistry.get(TEST_MODULE_ID);

    expect(registered?.status).toBe("error");

    expect(registered?.error).toBe("Simulated failure");
  });

  it("allows an errored module to be started again", async () => {
    await moduleManager.start(TEST_MODULE_ID);

    moduleManager.fail(TEST_MODULE_ID, "Temporary failure");

    expect(moduleRegistry.get(TEST_MODULE_ID)?.status).toBe("error");

    const restarted = await moduleManager.start(TEST_MODULE_ID);

    expect(restarted.status).toBe("running");

    expect(restarted.error).toBeUndefined();
  });

  it("rejects starting a module that is not registered", async () => {
    removeTestModule();

    await expect(moduleManager.start(TEST_MODULE_ID)).rejects.toThrow(
      `Module "${TEST_MODULE_ID}" is not registered.`,
    );
  });
});
