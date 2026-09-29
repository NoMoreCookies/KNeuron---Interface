import type { EEGChannelInfo, EEGStreamInfo } from "../models/eeg";

/**
 * One requested EEG channel resolved against the current device stream.
 */
export interface ResolvedEEGChannel {
  /**
   * Label requested by the consumer/module.
   */
  requestedLabel: string;

  /**
   * Position of the channel in the normalized device stream.
   */
  streamIndex: number;

  /**
   * Full channel metadata exposed by the adapter.
   */
  channel: Readonly<EEGChannelInfo>;
}

/**
 * Result of resolving module channel requirements against a device.
 */
export interface EEGChannelResolution {
  /**
   * Requested channels that exist in the current EEG stream.
   *
   * Ordering follows the requested label list, not the device's native
   * channel ordering.
   */
  resolved: readonly ResolvedEEGChannel[];

  /**
   * Requested labels that were not found.
   */
  missingLabels: readonly string[];

  /**
   * True when every requested channel exists.
   */
  complete: boolean;
}

/**
 * Makes channel matching tolerant of differences such as:
 *
 * "O1"
 * "o1"
 * " O1 "
 *
 * It deliberately does not attempt fuzzy anatomical matching.
 * PO3 must not silently become P3, for example.
 */
function normalizeChannelLabel(label: string): string {
  return label.trim().toUpperCase();
}

/**
 * Resolves a requested ordered set of EEG channels against an EEG stream.
 *
 * Modules should request channels by semantic label instead of hard-coded
 * array indexes or hardware-native indexes.
 *
 * Example:
 *
 * resolveEEGChannels(streamInfo, [
 *   "O1",
 *   "O2",
 *   "Oz",
 *   "PO3",
 *   "PO4",
 *   "POz",
 * ]);
 */
export function resolveEEGChannels(
  streamInfo: Readonly<EEGStreamInfo>,
  requestedLabels: readonly string[],
): EEGChannelResolution {
  const channelsByLabel = new Map<string, EEGChannelInfo>();

  for (const channel of streamInfo.channels) {
    channelsByLabel.set(normalizeChannelLabel(channel.label), channel);
  }

  const resolved: ResolvedEEGChannel[] = [];

  const missingLabels: string[] = [];

  for (const requestedLabel of requestedLabels) {
    const normalized = normalizeChannelLabel(requestedLabel);

    const channel = channelsByLabel.get(normalized);

    if (!channel) {
      missingLabels.push(requestedLabel);

      continue;
    }

    resolved.push({
      requestedLabel,

      streamIndex: channel.index,

      channel: {
        ...channel,
      },
    });
  }

  return {
    resolved,

    missingLabels,

    complete: missingLabels.length === 0,
  };
}
