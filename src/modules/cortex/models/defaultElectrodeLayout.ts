import type { CortexElectrode } from "./cortex";

/**
 * Anatomical visualization layout derived from the original BrainDance
 * fsaverage-based cortex project.
 *
 * IMPORTANT:
 * These are brain-local visualization coordinates. They are NOT native
 * BrainAccess channel numbers. Runtime EEG values are matched by label.
 */
export const DEFAULT_CORTEX_ELECTRODES: readonly CortexElectrode[] = [
  { label: "Fp1", position: [-0.5, 1.69, 0.85] },
  { label: "Fp2", position: [0.5, 1.69, 0.85] },
  { label: "F7", position: [-1.4, 1.08, 0.62] },
  { label: "F3", position: [-0.75, 1.19, 1.35] },
  { label: "Fz", position: [0, 1.29, 1.49] },
  { label: "F4", position: [0.75, 1.19, 1.35] },
  { label: "F8", position: [1.4, 1.08, 0.62] },
  { label: "FC5", position: [-1.43, 0.74, 0.91] },
  { label: "FC1", position: [-0.58, 0.78, 1.57] },
  { label: "FC2", position: [0.58, 0.78, 1.57] },
  { label: "FC6", position: [1.43, 0.74, 0.91] },
  { label: "T7", position: [-1.7, 0.25, 0.08] },
  { label: "C3", position: [-0.96, 0.31, 1.41] },
  { label: "Cz", position: [0, 0.38, 1.73] },
  { label: "C4", position: [0.96, 0.31, 1.41] },
  { label: "T8", position: [1.7, 0.25, 0.08] },
  { label: "CP5", position: [-1.47, -0.22, 0.7] },
  { label: "CP1", position: [-0.62, -0.18, 1.58] },
  { label: "CP2", position: [0.62, -0.18, 1.58] },
  { label: "CP6", position: [1.47, -0.22, 0.7] },
  { label: "P7", position: [-1.43, -0.65, 0.14] },
  { label: "P3", position: [-0.76, -0.66, 1.26] },
  { label: "Pz", position: [0, -0.66, 1.53] },
  { label: "P4", position: [0.76, -0.66, 1.26] },
  { label: "P8", position: [1.43, -0.65, 0.14] },
  { label: "PO3", position: [-0.62, -1.02, 0.82] },
  { label: "POz", position: [0, -1.08, 1.08] },
  { label: "PO4", position: [0.62, -1.02, 0.82] },
  { label: "O1", position: [-0.57, -1.29, 0.35] },
  { label: "Oz", position: [0, -1.43, 0.2] },
  { label: "O2", position: [0.57, -1.29, 0.35] },
  { label: "Iz", position: [0, -1.58, -0.18] },
];

export function cloneDefaultCortexElectrodes(): CortexElectrode[] {
  return DEFAULT_CORTEX_ELECTRODES.map((electrode) => ({
    label: electrode.label,
    position: [...electrode.position] as [number, number, number],
  }));
}
