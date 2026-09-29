import type { DeviceInfo } from "./device";

/**
 * Semantic type of a channel exposed by an EEG device.
 *
 * EEG devices sometimes expose auxiliary biosignal channels alongside
 * conventional scalp EEG electrodes, so the stream model should not assume
 * that every channel is EEG.
 */
export type EEGChannelType = "eeg" | "eog" | "emg" | "ecg" | "reference" | "aux" | "unknown";

/**
 * Physical unit used by a channel.
 */
export type EEGChannelUnit = "uV" | "mV" | "V" | "dimensionless" | "unknown";

/**
 * Describes one channel in the normalized KNeuron EEG stream.
 */
export interface EEGChannelInfo {
  /**
   * Zero-based position of this channel inside the normalized KNeuron stream.
   *
   * If values[0] corresponds to O1, then O1 has index 0.
   */
  index: number;

  /**
   * Human-readable electrode/channel label.
   *
   * Examples:
   * O1
   * O2
   * Oz
   * PO3
   */
  label: string;

  /**
   * Semantic channel type.
   */
  type: EEGChannelType;

  /**
   * Physical unit used for samples from this channel.
   */
  unit: EEGChannelUnit;

  /**
   * Optional original channel index reported by the device/driver.
   *
   * This lets adapters preserve hardware-specific mappings without leaking
   * those mappings into modules.
   *
   * Example for a BrainAccess device:
   * normalized O2 may have index 1 in KNeuron while its native source index
   * reported by the hardware is also stored here.
   */
  sourceIndex?: number;
}

/**
 * Static information specific to EEG devices.
 */
export interface EEGDeviceInfo extends DeviceInfo {
  kind: "eeg";
}

/**
 * Metadata describing an EEG stream.
 *
 * Nothing here assumes a specific headset, channel count or sampling rate.
 */
export interface EEGStreamInfo {
  /**
   * Effective sampling frequency in samples per second.
   *
   * Examples:
   * 128
   * 250
   * 256
   * 500
   */
  sampleRateHz: number;

  /**
   * Ordered channel definition.
   *
   * Sample values produced later by the streaming layer must follow exactly
   * this ordering.
   */
  channels: readonly EEGChannelInfo[];
}
