import { BrainAccessEEGAdapter } from "./adapters/brainaccess/BrainAccessEEGAdapter";

import { BrainLinkAdapter } from "./adapters/brainlink/BrainLinkAdapter";

import type { DeviceAdapter } from "./contracts/DeviceAdapter";

import { deviceRegistry } from "./deviceRegistry";

/**
 * Production hardware bundled with KNeuron.
 *
 * Simulation EEG was intentionally removed from the production Device page.
 */
function createBuiltInDevices(): DeviceAdapter[] {
  return [new BrainAccessEEGAdapter(), new BrainLinkAdapter()];
}

export function registerBuiltInDevices(): void {
  const adapters = createBuiltInDevices();

  for (const adapter of adapters) {
    if (deviceRegistry.has(adapter.info.id)) {
      continue;
    }

    deviceRegistry.register(adapter);
  }
}
