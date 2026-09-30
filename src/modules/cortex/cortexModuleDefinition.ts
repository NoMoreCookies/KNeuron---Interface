import type { KNeuronModuleDefinition } from "../../features/modules/moduleDefinition";

import { CortexModule } from "./CortexModule";
import { cortexManifest } from "./cortexManifest";

export const cortexModuleDefinition: KNeuronModuleDefinition = {
  manifest: cortexManifest,
  component: CortexModule,
};
