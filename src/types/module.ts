/**
 * Version of the module manifest schema understood by this KNeuron Shell.
 *
 * This is intentionally independent from the module's own version.
 * If the manifest format changes in the future, schemaVersion lets the
 * shell determine whether it can safely load a module.
 */
export type ModuleManifestSchemaVersion = 1;

export type ModuleCategory =
  | "BCI"
  | "VISUALIZATION"
  | "GAME"
  | "ANALYSIS"
  | "UTILITY";

export interface ModuleAppearance {
  /**
   * Path or URL used as the module card thumbnail.
   * The shell is responsible for displaying a fallback when it is absent.
   */
  thumbnail?: string;
}

export interface ModuleEEGCapability {
  /**
   * Whether the module cannot operate without an EEG stream.
   */
  required: boolean;

  /**
   * Channels the module would prefer to receive.
   *
   * They are preferences rather than a guarantee. DeviceManager will
   * eventually resolve them against the connected hardware.
   */
  preferredChannels?: string[];
}

export interface ModuleCapabilities {
  eeg?: ModuleEEGCapability;
}

/**
 * Public contract between a KNeuron module and the desktop shell.
 *
 * The shell should use this manifest for discovery and presentation.
 * It must not contain module-specific knowledge such as FBCCA parameters
 * or Cortex rendering settings.
 */
export interface KNeuronModuleManifest {
  schemaVersion: ModuleManifestSchemaVersion;

  /**
   * Stable machine-readable identifier.
   *
   * Example: "cortex-3d".
   * This must not change merely because the visible module name changes.
   */
  id: string;

  name: string;
  version: string;
  description: string;
  category: ModuleCategory;

  appearance: ModuleAppearance;

  /**
   * Logical route/entry point owned by the module.
   *
   * Example: "/modules/cortex-3d".
   */
  entryPoint: string;

  capabilities: ModuleCapabilities;
}

export type ModuleRuntimeStatus =
  | "available"
  | "starting"
  | "running"
  | "error"
  | "disabled";

export interface RegisteredModule {
  manifest: KNeuronModuleManifest;
  status: ModuleRuntimeStatus;
  error?: string;
}