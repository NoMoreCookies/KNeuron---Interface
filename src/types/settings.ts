/**
 * Global KNeuron Shell settings.
 *
 * These settings belong to the desktop application itself.
 * Module-specific configuration must remain inside individual modules.
 */
export interface AppSettings {
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
