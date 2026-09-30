import type {
  KNeuronModuleDefinition,
} from "../../features/modules/moduleDefinition";

import {
  MinerModule,
} from "./MinerModule";

import {
  minerManifest,
} from "./minerManifest";

export const minerModuleDefinition:
  KNeuronModuleDefinition = {
  manifest:
    minerManifest,
  component:
    MinerModule,
};
