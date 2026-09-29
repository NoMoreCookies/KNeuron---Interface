import type { DeviceAdapter, DeviceUnsubscribe } from "./DeviceAdapter";

import type { EEGDeviceInfo, EEGStreamInfo } from "../models/eeg";

import type { EEGSampleBatchListener } from "../../eeg/models";

/**
 * Specialized contract implemented by EEG-capable device adapters.
 *
 * Device-specific SDKs, Bluetooth logic or Python IPC must remain behind
 * this interface.
 */
export interface EEGDeviceAdapter extends DeviceAdapter {
  readonly info: Readonly<EEGDeviceInfo>;

  /**
   * Returns metadata describing the normalized EEG stream.
   */
  getStreamInfo(): Promise<Readonly<EEGStreamInfo>>;

  /**
   * Starts the physical/logical EEG stream.
   *
   * The adapter must already be connected.
   */
  startStream(): Promise<void>;

  /**
   * Stops EEG sample production without necessarily disconnecting
   * the physical device.
   */
  stopStream(): Promise<void>;

  /**
   * Returns whether this adapter is currently producing EEG data.
   */
  isStreaming(): boolean;

  /**
   * Receives full normalized EEG batches from this adapter.
   *
   * Adapter batches always contain the complete stream exposed
   * by getStreamInfo().
   */
  subscribeSamples(listener: EEGSampleBatchListener): DeviceUnsubscribe;
}
