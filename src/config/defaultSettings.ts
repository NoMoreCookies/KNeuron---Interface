import type { AppSettings } from "../types/settings";

/**
 * Default KNeuron Shell settings.
 *
 * These values are used:
 * - on first application launch,
 * - when persisted settings are unavailable,
 * - after the user resets settings.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,

  uiScale: 100,

  confirmBeforeClosingModule: true,

  showDebugInformation: false,
};