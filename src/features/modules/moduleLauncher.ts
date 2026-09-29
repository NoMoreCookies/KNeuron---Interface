import { logger } from "../../lib/logger";

import { moduleManager } from "./moduleManager";

import type { RegisteredModule } from "../../types/module";

/**
 * Public entry point used by the UI to open a module.
 *
 * UI components should not call ModuleManager directly.
 * This function acts as the boundary between the shell UI
 * and the module lifecycle layer.
 */
export async function launchModule(moduleId: string): Promise<RegisteredModule> {
  logger.info("ModuleManager", `Launch requested: ${moduleId}`);

  return moduleManager.start(moduleId);
}

/**
 * Public entry point used by the UI when leaving a module.
 *
 * Keeping close requests here gives KNeuron one consistent
 * place for lifecycle logging and future launch/close hooks.
 */
export function closeModule(moduleId: string): RegisteredModule {
  logger.info("ModuleManager", `Close requested: ${moduleId}`);

  return moduleManager.stop(moduleId);
}
