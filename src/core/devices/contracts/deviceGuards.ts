import type { DeviceAdapter } from "./DeviceAdapter";
import type { EEGDeviceAdapter } from "./EEGDeviceAdapter";

/**
 * Runtime type guard for EEG-capable device adapters.
 *
 * DeviceManager remains completely generic. Code that specifically needs
 * EEG metadata may use this helper instead of checking manufacturers or IDs.
 */
export function isEEGDeviceAdapter(adapter: DeviceAdapter): adapter is EEGDeviceAdapter {
  if (adapter.info.kind !== "eeg") {
    return false;
  }

  return "getStreamInfo" in adapter && typeof adapter.getStreamInfo === "function";
}
