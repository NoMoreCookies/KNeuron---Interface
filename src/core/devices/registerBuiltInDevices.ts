import { SimulationEEGAdapter } from "./adapters/simulation/SimulationEEGAdapter";

import type { DeviceAdapter } from "./contracts/DeviceAdapter";

import { deviceRegistry } from "./deviceRegistry";

/**
 * Creates adapters bundled directly with KNeuron.
 *
 * Adding another built-in device should normally require:
 *
 * 1. implementing DeviceAdapter / EEGDeviceAdapter,
 * 2. importing the adapter here,
 * 3. adding one instance to this array,
 * 4. adding adapter-specific tests.
 *
 * DeviceManager must not be modified for each hardware manufacturer.
 */
function createBuiltInDevices(): DeviceAdapter[] {
  return [new SimulationEEGAdapter()];
}

/**
 * Registers device adapters bundled with the current KNeuron build.
 *
 * Registration is intentionally idempotent to remain safe during
 * development and future initialization flows.
 */
export function registerBuiltInDevices(): void {
  const adapters = createBuiltInDevices();

  for (const adapter of adapters) {
    if (deviceRegistry.has(adapter.info.id)) {
      continue;
    }

    deviceRegistry.register(adapter);
  }
}
