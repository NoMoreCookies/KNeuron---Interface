import type { ComponentType } from "react";

import type { KNeuronModuleManifest } from "../../types/module";

/**
 * Props supplied by the KNeuron Shell to every module component.
 *
 * Additional shell-level APIs may be added here in the future,
 * but modules should remain independent from App.tsx.
 */
export interface KNeuronModuleProps {
  /**
   * Requests leaving the currently active module.
   *
   * The shell remains responsible for lifecycle handling and
   * optional exit confirmation.
   */
  onRequestClose: () => void;
}

/**
 * React component mounted by ModuleHost.
 */
export type KNeuronModuleComponent = ComponentType<KNeuronModuleProps>;

/**
 * Complete definition of an installable/built-in KNeuron module.
 *
 * A definition combines:
 *
 * - immutable module metadata,
 * - the React implementation mounted by ModuleHost.
 */
export interface KNeuronModuleDefinition {
  manifest: KNeuronModuleManifest;

  component: KNeuronModuleComponent;
}
