/**
 * Supported UI scaling levels.
 *
 * Keeping this as a strict union prevents arbitrary values
 * from entering application state.
 */
export type UIScale =
  | 90
  | 100
  | 110;

/**
 * Global KNeuron Shell settings.
 *
 * These settings belong to the desktop application itself.
 * Module-specific configuration must remain inside individual modules.
 */
export interface AppSettings {
  /**
   * Enables visual transitions and interface animations.
   */
  animationsEnabled: boolean;

  /**
   * Global interface scaling expressed as a percentage.
   */
  uiScale: UIScale;

  /**
   * When enabled, KNeuron asks for confirmation before leaving
   * a currently running module.
   */
  confirmBeforeClosingModule: boolean;

  /**
   * Enables additional development/debug information in the UI.
   *
   * This does not enable development modules by itself.
   */
  showDebugInformation: boolean;
}