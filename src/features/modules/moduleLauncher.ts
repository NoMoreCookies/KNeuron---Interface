import { moduleManager } from "./moduleManager";

import type { RegisteredModule } from "../../types/module";

/**
 * Public entry point used by the UI to open a module.
 *
 * UI components must not call ModuleManager directly.
 */
export async function launchModule(
  moduleId: string,
): Promise<RegisteredModule> {
  console.info(
    `[KNeuron] Module launch requested: ${moduleId}`,
  );

  return moduleManager.start(moduleId);
}

/**
 * Public entry point used by the UI when leaving a module.
 */
export function closeModule(
  moduleId: string,
): RegisteredModule {
  console.info(
    `[KNeuron] Module close requested: ${moduleId}`,
  );

  return moduleManager.stop(moduleId);
}