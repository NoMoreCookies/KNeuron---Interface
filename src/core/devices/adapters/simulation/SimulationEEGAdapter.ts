import type { DeviceStatus } from "../../models/device";

import type { EEGChannelInfo, EEGDeviceInfo, EEGStreamInfo } from "../../models/eeg";

import type { DeviceStatusListener, DeviceUnsubscribe } from "../../contracts/DeviceAdapter";

import type { EEGDeviceAdapter } from "../../contracts/EEGDeviceAdapter";

import type { EEGSampleBatch, EEGSampleBatchListener } from "../../../eeg/models";

const SAMPLE_RATE_HZ = 250;

/**
 * Produce 10 samples every 40 ms.
 *
 * 250 Hz * 0.04 s = 10 samples.
 */
const BATCH_SAMPLE_COUNT = 10;

const BATCH_INTERVAL_MS = (BATCH_SAMPLE_COUNT / SAMPLE_RATE_HZ) * 1000;

const SIMULATION_CHANNELS: readonly EEGChannelInfo[] = [
  {
    index: 0,
    sourceIndex: 0,
    label: "Fp1",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 1,
    sourceIndex: 1,
    label: "Fp2",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 2,
    sourceIndex: 2,
    label: "F7",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 3,
    sourceIndex: 3,
    label: "F3",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 4,
    sourceIndex: 4,
    label: "Fz",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 5,
    sourceIndex: 5,
    label: "F4",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 6,
    sourceIndex: 6,
    label: "F8",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 7,
    sourceIndex: 7,
    label: "FC5",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 8,
    sourceIndex: 8,
    label: "FC1",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 9,
    sourceIndex: 9,
    label: "FC2",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 10,
    sourceIndex: 10,
    label: "FC6",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 11,
    sourceIndex: 11,
    label: "T7",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 12,
    sourceIndex: 12,
    label: "C3",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 13,
    sourceIndex: 13,
    label: "Cz",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 14,
    sourceIndex: 14,
    label: "C4",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 15,
    sourceIndex: 15,
    label: "T8",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 16,
    sourceIndex: 16,
    label: "CP5",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 17,
    sourceIndex: 17,
    label: "CP1",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 18,
    sourceIndex: 18,
    label: "CP2",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 19,
    sourceIndex: 19,
    label: "CP6",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 20,
    sourceIndex: 20,
    label: "P7",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 21,
    sourceIndex: 21,
    label: "P3",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 22,
    sourceIndex: 22,
    label: "Pz",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 23,
    sourceIndex: 23,
    label: "P4",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 24,
    sourceIndex: 24,
    label: "P8",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 25,
    sourceIndex: 25,
    label: "PO3",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 26,
    sourceIndex: 26,
    label: "POz",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 27,
    sourceIndex: 27,
    label: "PO4",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 28,
    sourceIndex: 28,
    label: "O1",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 29,
    sourceIndex: 29,
    label: "Oz",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 30,
    sourceIndex: 30,
    label: "O2",
    type: "eeg",
    unit: "uV",
  },
  {
    index: 31,
    sourceIndex: 31,
    label: "Iz",
    type: "eeg",
    unit: "uV",
  },
];

const SIMULATION_INFO: EEGDeviceInfo = {
  id: "simulation-eeg",
  name: "Simulation EEG",
  kind: "eeg",
  transport: "simulation",
  manufacturer: "KNeuron",
  model: "32-channel EEG simulator",
};

const SIMULATION_STREAM_INFO: EEGStreamInfo = {
  sampleRateHz: SAMPLE_RATE_HZ,
  channels: SIMULATION_CHANNELS,
};

/**
 * Built-in deterministic EEG simulator.
 *
 * It deliberately emits all 32 channels. Consumers such as SSVEP modules
 * select only the channels they need through EEGStreamService.
 */
export class SimulationEEGAdapter implements EEGDeviceAdapter {
  readonly info: Readonly<EEGDeviceInfo> = SIMULATION_INFO;

  private status: DeviceStatus = {
    state: "disconnected",
    message: "Simulation EEG is disconnected.",
    updatedAt: Date.now(),
  };

  private readonly statusListeners = new Set<DeviceStatusListener>();

  private readonly sampleListeners = new Set<EEGSampleBatchListener>();

  private streaming = false;

  private intervalId: number | null = null;

  private sampleCursor = 0;

  private streamStartedAtMs = 0;

  getStatus(): Readonly<DeviceStatus> {
    return {
      ...this.status,
    };
  }

  async connect(): Promise<void> {
    if (this.status.state === "connected") {
      return;
    }

    this.setStatus({
      state: "connecting",
      message: "Starting simulated EEG device...",
      updatedAt: Date.now(),
    });

    await Promise.resolve();

    this.setStatus({
      state: "connected",
      message: "Simulation EEG connected.",
      updatedAt: Date.now(),
    });
  }

  async disconnect(): Promise<void> {
    if (this.status.state === "disconnected") {
      return;
    }

    if (this.streaming) {
      await this.stopStream();
    }

    this.setStatus({
      state: "disconnecting",
      message: "Stopping simulated EEG device...",
      updatedAt: Date.now(),
    });

    await Promise.resolve();

    this.setStatus({
      state: "disconnected",
      message: "Simulation EEG is disconnected.",
      updatedAt: Date.now(),
    });
  }

  async getStreamInfo(): Promise<Readonly<EEGStreamInfo>> {
    return {
      sampleRateHz: SIMULATION_STREAM_INFO.sampleRateHz,

      channels: SIMULATION_STREAM_INFO.channels.map((channel) => ({
        ...channel,
      })),
    };
  }

  isStreaming(): boolean {
    return this.streaming;
  }

  async startStream(): Promise<void> {
    if (this.streaming) {
      return;
    }

    if (this.status.state !== "connected") {
      throw new Error("Simulation EEG must be connected before streaming can start.");
    }

    this.sampleCursor = 0;

    this.streamStartedAtMs = Date.now();

    this.streaming = true;

    this.intervalId = window.setInterval(() => {
      this.emitSampleBatch();
    }, BATCH_INTERVAL_MS);
  }

  async stopStream(): Promise<void> {
    if (!this.streaming) {
      return;
    }

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);

      this.intervalId = null;
    }

    this.streaming = false;

    await Promise.resolve();
  }

  subscribeStatus(listener: DeviceStatusListener): DeviceUnsubscribe {
    this.statusListeners.add(listener);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  subscribeSamples(listener: EEGSampleBatchListener): DeviceUnsubscribe {
    this.sampleListeners.add(listener);

    return () => {
      this.sampleListeners.delete(listener);
    };
  }

  private emitSampleBatch(): void {
    if (!this.streaming) {
      return;
    }

    const sequenceStart = this.sampleCursor;

    const values = SIMULATION_CHANNELS.map((_, channelIndex) => {
      const channelValues: number[] = [];

      for (let sampleOffset = 0; sampleOffset < BATCH_SAMPLE_COUNT; sampleOffset++) {
        const sampleNumber = sequenceStart + sampleOffset;

        const timeSeconds = sampleNumber / SAMPLE_RATE_HZ;

        /**
         * Deterministic synthetic EEG:
         *
         * - dominant 10 Hz alpha component,
         * - weaker 20 Hz component,
         * - small channel-dependent phase offset.
         *
         * No random noise is used so automated tests remain repeatable.
         */
        const phaseOffset = channelIndex * 0.08;

        const value =
          18 * Math.sin(2 * Math.PI * 10 * timeSeconds + phaseOffset) +
          4 * Math.sin(2 * Math.PI * 20 * timeSeconds);

        channelValues.push(value);
      }

      return channelValues;
    });

    const batch: EEGSampleBatch = {
      sequenceStart,

      timestampStartMs: this.streamStartedAtMs + (sequenceStart / SAMPLE_RATE_HZ) * 1000,

      sampleRateHz: SAMPLE_RATE_HZ,

      sampleCount: BATCH_SAMPLE_COUNT,

      channelCount: SIMULATION_CHANNELS.length,

      values,

      sourceSampleNumberStart: sequenceStart,
    };

    this.sampleCursor += BATCH_SAMPLE_COUNT;

    for (const listener of this.sampleListeners) {
      listener(batch);
    }
  }

  private setStatus(status: DeviceStatus): void {
    this.status = status;

    const snapshot = {
      ...status,
    };

    for (const listener of this.statusListeners) {
      listener(snapshot);
    }
  }
}
