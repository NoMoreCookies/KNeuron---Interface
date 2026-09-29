import { developmentModules } from "../../config/developmentModules";
import { moduleRegistry } from "../../lib/moduleRegistry";

/**
 * Registers modules used during shell development.
 *
 * This function is intentionally idempotent so React development behaviour
 * cannot accidentally register the same module twice.
 */
export function registerDevelopmentModules(): void {
  for (const manifest of developmentModules) {
    if (moduleRegistry.has(manifest.id)) {
      continue;
    }

    moduleRegistry.register(manifest);
  }
}