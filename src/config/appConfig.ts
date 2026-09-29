/**
 * Global configuration of the KNeuron desktop shell.
 *
 * Shell-wide metadata belongs here instead of being duplicated
 * across React components.
 */
export const APP_CONFIG = {
  name: "KNeuron",

  version: "0.2.3",

  /**
   * Application license identifier.
   *
   * Keep this value synchronized with package metadata.
   *
   * Replace "UNLICENSED" once the final project license is chosen.
   */
  license: "UNLICENSED",

  /**
   * True when KNeuron is running through Vite development mode.
   */
  isDevelopment: import.meta.env.DEV,

  /**
   * Temporary development modules are available only
   * while developing KNeuron.
   */
  enableDevelopmentModules: import.meta.env.DEV,
} as const;