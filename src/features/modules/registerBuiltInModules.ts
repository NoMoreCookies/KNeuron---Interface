import { moduleRegistry } from "../../lib/moduleRegistry";

import { moduleComponentRegistry } from "./moduleComponentRegistry";

import { registerModuleDefinition } from "./registerModuleDefinition";

import type { KNeuronModuleDefinition } from "./moduleDefinition";

/**
 * Modules shipped as part of KNeuron itself.
 *
 * Cortex, SSVEP and other production modules will be added here.
 */
function createBuiltInModules(): KNeuronModuleDefinition[] {
  return [];
}

/**
 * Registers all modules bundled with KNeuron.
 *
 * Registration is intentionally idempotent to make development
 * initialization predictable.
 */
export function registerBuiltInModules(): void {
  const definitions = createBuiltInModules();

  for (const definition of definitions) {
    const moduleId = definition.manifest.id;

    const manifestExists = moduleRegistry.has(moduleId);

    const componentExists = moduleComponentRegistry.has(moduleId);

    /**
     * A fully registered definition may safely be skipped.
     */
    if (manifestExists && componentExists) {
      continue;
    }

    /**
     * One registry containing the module while the other does not
     * indicates corrupted initialization state.
     */
    if (manifestExists !== componentExists) {
      throw new Error(`Inconsistent module registration state for "${moduleId}".`);
    }

    registerModuleDefinition(definition);
  }
}
