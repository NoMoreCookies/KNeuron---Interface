import type { KNeuronModuleManifest } from "../types/module";

/**
 * Creates a valid KNeuron module manifest for tests.
 *
 * Individual tests may override only the properties relevant
 * to the behaviour being verified.
 */
export function createTestModuleManifest(
  overrides: Partial<KNeuronModuleManifest> = {},
): KNeuronModuleManifest {
  const id = overrides.id ?? "test-module";

  return {
    schemaVersion: 1,
    id,
    name: "Test Module",
    version: "1.0.0",
    description: "Module used by automated KNeuron tests.",
    category: "UTILITY",
    appearance: {},
    entryPoint: `/modules/${id}`,
    capabilities: {
      eeg: {
        required: false,
      },
    },

    ...overrides,
  };
}
