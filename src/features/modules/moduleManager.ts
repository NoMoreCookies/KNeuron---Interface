import { moduleRegistry } from "../../lib/moduleRegistry";

import type { ModuleRuntimeStatus, RegisteredModule } from "../../types/module";

/**
 * Defines legal runtime state transitions.
 *
 * Keeping this explicit prevents accidental transitions such as:
 *
 * disabled -> running
 *
 * without going through the expected startup lifecycle.
 */
const ALLOWED_TRANSITIONS: Record<ModuleRuntimeStatus, readonly ModuleRuntimeStatus[]> = {
  available: ["starting", "disabled"],

  starting: ["running", "error", "available"],

  running: ["available", "error", "disabled"],

  error: ["starting", "available", "disabled"],

  disabled: ["available"],
};

/**
 * Coordinates the runtime lifecycle of KNeuron modules.
 *
 * ModuleManager does NOT render modules and does NOT perform navigation.
 */
export class ModuleManager {
  /**
   * Starts a registered module.
   */
  async start(moduleId: string): Promise<RegisteredModule> {
    const registeredModule = this.requireModule(moduleId);

    if (registeredModule.status === "disabled") {
      throw new Error(`Module "${moduleId}" is disabled.`);
    }

    /**
     * Starting an already running module is harmless.
     *
     * This also protects against repeated Open clicks.
     */
    if (registeredModule.status === "running") {
      return registeredModule;
    }

    if (registeredModule.status === "starting") {
      return registeredModule;
    }

    this.transition(moduleId, "starting");

    try {
      /**
       * There is no external module runtime yet.
       *
       * Later this is where ModuleManager will ask the runtime layer
       * to initialise the actual module.
       */
      await Promise.resolve();

      return this.transition(moduleId, "running");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown module startup error.";

      this.transition(moduleId, "error", message);

      throw error;
    }
  }

  /**
   * Stops a module and returns it to the available state.
   */
  stop(moduleId: string): RegisteredModule {
    const registeredModule = this.requireModule(moduleId);

    if (registeredModule.status === "available") {
      return registeredModule;
    }

    if (registeredModule.status === "disabled") {
      return registeredModule;
    }

    return this.transition(moduleId, "available");
  }

  /**
   * Marks a running module as failed.
   *
   * ModuleErrorBoundary will use this method when module rendering crashes.
   */
  fail(moduleId: string, error: unknown): RegisteredModule {
    const registeredModule = this.requireModule(moduleId);

    const message = error instanceof Error ? error.message : String(error);

    if (registeredModule.status === "error") {
      return registeredModule;
    }

    return this.transition(moduleId, "error", message);
  }

  /**
   * Returns a module or throws a descriptive error.
   */
  private requireModule(moduleId: string): RegisteredModule {
    const registeredModule = moduleRegistry.get(moduleId);

    if (!registeredModule) {
      throw new Error(`Module "${moduleId}" is not registered.`);
    }

    return registeredModule;
  }

  /**
   * Performs a validated lifecycle transition.
   */
  private transition(
    moduleId: string,
    targetStatus: ModuleRuntimeStatus,
    error?: string,
  ): RegisteredModule {
    const currentModule = this.requireModule(moduleId);

    const allowedTargets = ALLOWED_TRANSITIONS[currentModule.status];

    if (!allowedTargets.includes(targetStatus)) {
      throw new Error(
        `Illegal module state transition for "${moduleId}": ` +
          `${currentModule.status} -> ${targetStatus}.`,
      );
    }

    return moduleRegistry.setRuntimeState(moduleId, targetStatus, error);
  }
}

/**
 * Shared manager for the running KNeuron Shell.
 */
export const moduleManager = new ModuleManager();
