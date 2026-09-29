import type { KNeuronModuleManifest } from "../types/module";

/**
 * Temporary modules used while developing the KNeuron Shell.
 *
 * Real modules will eventually be discovered automatically.
 * Nothing in Dashboard should depend on these particular module IDs.
 */
export const developmentModules: KNeuronModuleManifest[] = [
  {
    schemaVersion: 1,

    id: "test-module",

    name: "Test Module",

    version: "1.0.0",

    description: "Development module used to verify the KNeuron module launcher.",

    category: "UTILITY",

    appearance: {},

    entryPoint: "/modules/test-module",

    capabilities: {
      eeg: {
        required: false,
      },
    },
  },
];
