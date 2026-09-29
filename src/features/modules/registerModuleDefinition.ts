import { moduleRegistry } from "../../lib/moduleRegistry";

import { moduleComponentRegistry } from "./moduleComponentRegistry";

import type { KNeuronModuleDefinition } from "./moduleDefinition";

/**
 * Registers a complete KNeuron module definition.
 *
 * Metadata and React implementation are registered together.
 *
 * If component registration fails after manifest registration,
 * the manifest is rolled back so KNeuron never remains in a
 * partially registered state.
 */
export function registerModuleDefinition(definition: KNeuronModuleDefinition): void {
  const { manifest, component } = definition;

  if (moduleRegistry.has(manifest.id)) {
    throw new Error(
      `Cannot register module definition. Module "${manifest.id}" is already registered.`,
    );
  }

  if (moduleComponentRegistry.has(manifest.id)) {
    throw new Error(
      `Cannot register module definition. Component "${manifest.id}" is already registered.`,
    );
  }

  let manifestRegistered = false;

  try {
    moduleRegistry.register(manifest);

    manifestRegistered = true;

    moduleComponentRegistry.register(manifest.id, component);
  } catch (error) {
    /**
     * Keep the two registries consistent if the second registration
     * unexpectedly fails.
     */
    if (manifestRegistered && moduleRegistry.has(manifest.id)) {
      moduleRegistry.unregister(manifest.id);
    }

    throw error;
  }
}
