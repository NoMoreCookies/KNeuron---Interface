import type { KNeuronModuleComponent } from "./moduleDefinition";

/**
 * Stores React implementations of KNeuron modules.
 *
 * ModuleRegistry stores metadata and runtime lifecycle state.
 * ModuleComponentRegistry stores only executable React components.
 *
 * Keeping these responsibilities separate prevents UI implementation
 * details from leaking into the generic module lifecycle layer.
 */
export class ModuleComponentRegistry {
  private readonly components = new Map<string, KNeuronModuleComponent>();

  /**
   * Registers the React implementation for one module ID.
   */
  register(moduleId: string, component: KNeuronModuleComponent): void {
    if (this.components.has(moduleId)) {
      throw new Error(`Module component "${moduleId}" is already registered.`);
    }

    this.components.set(moduleId, component);
  }

  /**
   * Removes one module implementation.
   */
  unregister(moduleId: string): boolean {
    return this.components.delete(moduleId);
  }

  /**
   * Returns a registered module component.
   */
  get(moduleId: string): KNeuronModuleComponent | undefined {
    return this.components.get(moduleId);
  }

  /**
   * Checks whether a React implementation exists.
   */
  has(moduleId: string): boolean {
    return this.components.has(moduleId);
  }

  /**
   * Returns IDs of all components registered in this registry.
   */
  getAllIds(): string[] {
    return [...this.components.keys()];
  }
}

/**
 * Application-wide React module implementation registry.
 */
export const moduleComponentRegistry = new ModuleComponentRegistry();
