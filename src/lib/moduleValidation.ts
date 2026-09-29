import type { KNeuronModuleManifest, ModuleCategory } from "../types/module";

/**
 * Module identifiers are deliberately restrictive.
 *
 * Allowed:
 *   cortex-3d
 *   miner-game
 *   ssvep-control
 *
 * Rejected:
 *   Cortex 3D
 *   ../cortex
 *   cortex_3d
 */
const MODULE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_CATEGORIES: readonly ModuleCategory[] = [
  "BCI",
  "VISUALIZATION",
  "GAME",
  "ANALYSIS",
  "UTILITY",
];

export interface ModuleValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a KNeuron module manifest before registration.
 *
 * IMPORTANT:
 * Validation belongs at the boundary of the module system. Invalid
 * manifests must never enter ModuleRegistry.
 */
export function validateModuleManifest(manifest: KNeuronModuleManifest): ModuleValidationResult {
  const errors: string[] = [];

  if (manifest.schemaVersion !== 1) {
    errors.push(`Unsupported manifest schema version: ${manifest.schemaVersion}.`);
  }

  if (!manifest.id || !MODULE_ID_PATTERN.test(manifest.id)) {
    errors.push("Module ID must contain only lowercase letters, numbers and hyphens.");
  }

  if (!manifest.name?.trim()) {
    errors.push("Module name is required.");
  }

  if (!manifest.version?.trim()) {
    errors.push("Module version is required.");
  }

  if (!manifest.description?.trim()) {
    errors.push("Module description is required.");
  }

  if (!ALLOWED_CATEGORIES.includes(manifest.category)) {
    errors.push(`Unsupported module category: ${String(manifest.category)}.`);
  }

  const expectedEntryPoint = `/modules/${manifest.id}`;

  if (manifest.entryPoint !== expectedEntryPoint) {
    errors.push(`Module entry point must be "${expectedEntryPoint}".`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
