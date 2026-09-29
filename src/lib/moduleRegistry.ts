import type { KNeuronModuleManifest, ModuleRuntimeStatus, RegisteredModule } from "../types/module";

import { validateModuleManifest } from "./moduleValidation";

/**
 * Function called whenever the module registry changes.
 */
type ModuleRegistryListener = () => void;

/**
 * Stores all modules known to the running KNeuron Shell.
 *
 * Responsibilities:
 * - validate manifests before registration,
 * - prevent duplicate module IDs,
 * - expose registered modules,
 * - store runtime status,
 * - notify UI subscribers when registry state changes.
 *
 * Non-responsibilities:
 * - module navigation,
 * - module startup logic,
 * - EEG/device management,
 * - React rendering.
 */
export class ModuleRegistry {
  private readonly modules = new Map<string, RegisteredModule>();

  /**
   * React and other consumers may subscribe to registry changes.
   */
  private readonly listeners = new Set<ModuleRegistryListener>();

  /**
   * Registers a module manifest.
   */
  register(manifest: KNeuronModuleManifest): RegisteredModule {
    const validation = validateModuleManifest(manifest);

    if (!validation.valid) {
      throw new Error(`Invalid module "${manifest.id}": ${validation.errors.join(" ")}`);
    }

    if (this.modules.has(manifest.id)) {
      throw new Error(`Module with ID "${manifest.id}" is already registered.`);
    }

    const registeredModule: RegisteredModule = {
      manifest,
      status: "available",
    };

    this.modules.set(manifest.id, registeredModule);

    this.emitChange();

    return registeredModule;
  }

  /**
   * Removes a module from the registry.
   */
  unregister(moduleId: string): void {
    const removed = this.modules.delete(moduleId);

    if (removed) {
      this.emitChange();
    }
  }

  /**
   * Returns one registered module.
   */
  get(moduleId: string): RegisteredModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Returns a new array containing all registered modules.
   *
   * Returning a copy prevents callers from mutating the registry's internal
   * Map directly.
   */
  getAll(): RegisteredModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Checks whether a module ID is already registered.
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Updates only runtime information for a registered module.
   *
   * Module manifests remain immutable after registration.
   */
  setRuntimeState(moduleId: string, status: ModuleRuntimeStatus, error?: string): RegisteredModule {
    const currentModule = this.modules.get(moduleId);

    if (!currentModule) {
      throw new Error(`Cannot update runtime state. Module "${moduleId}" is not registered.`);
    }

    const updatedModule: RegisteredModule = error
      ? {
          manifest: currentModule.manifest,
          status,
          error,
        }
      : {
          manifest: currentModule.manifest,
          status,
        };

    this.modules.set(moduleId, updatedModule);

    this.emitChange();

    return updatedModule;
  }

  /**
   * Adds a listener that is called whenever registry state changes.
   *
   * The returned function removes the listener.
   */
  subscribe(listener: ModuleRegistryListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifies all subscribers that the registry has changed.
   */
  private emitChange(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * Shared registry for the running KNeuron Shell.
 */
export const moduleRegistry = new ModuleRegistry();
