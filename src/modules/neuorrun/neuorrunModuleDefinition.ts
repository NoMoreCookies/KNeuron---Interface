import type { KNeuronModuleDefinition } from "../../features/modules/moduleDefinition";

import { NeuorrunModule } from "./NeuorrunModule";

import { neuorrunManifest } from "./neuorrunManifest";

export const neuorrunModuleDefinition: KNeuronModuleDefinition = {
  manifest: neuorrunManifest,
  component: NeuorrunModule,
};
