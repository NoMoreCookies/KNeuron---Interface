import { deviceManager, type DeviceManager } from "../devices/deviceManager";
import { isEEGDeviceAdapter } from "../devices/contracts/deviceGuards";
import type { EEGDeviceAdapter } from "../devices/contracts/EEGDeviceAdapter";
import type { EEGChannelInfo, EEGStreamInfo } from "../devices/models/eeg";
import { resolveEEGChannels } from "../devices/eeg/channelSelection";
import { logger } from "../../lib/logger";
import { EEGRingBuffer } from "./EEGRingBuffer";
import type {
  EEGConsumerBatch,
  EEGConsumerBatchListener,
  EEGSampleBatch,
  EEGWindow,
} from "./models";

export interface EEGStreamRequest {
  /**
   * "all" means every channel exposed by the current EEG device.
   *
   * A string array requests only selected channel labels.
   */
  channels: "all" | readonly string[];

  /**
   * Optional real-time callback.
   */
  onBatch?: EEGConsumerBatchListener;
}

export interface EEGStreamHandle {
  readonly id: number;

  readonly channels: readonly Readonly<EEGChannelInfo>[];

  readonly streamInfo: Readonly<EEGStreamInfo>;

  /**
   * Releases this consumer.
   *
   * The physical stream is stopped only after the final consumer releases its
   * handle and the short hand-off grace period expires.
   */
  release(): Promise<void>;
}

interface ConsumerRecord {
  channels: readonly Readonly<EEGChannelInfo>[];

  channelIndices: readonly number[];

  listener?: EEGConsumerBatchListener;
}

interface EEGStreamServiceOptions {
  /**
   * Number of seconds retained in the shared history buffer.
   */
  bufferDurationSeconds?: number;

  /**
   * How long the service keeps the physical EEG stream alive after the final
   * consumer releases it.
   *
   * This prevents a rapid Cortex -> Miner transition from racing
   * stopStream() against startStream().
   */
  stopGracePeriodMs?: number;
}

interface PendingStop {
  timer: ReturnType<typeof setTimeout> | null;

  cancelled: boolean;

  promise: Promise<void>;

  resolve: () => void;

  reject: (reason?: unknown) => void;
}

const DEFAULT_BUFFER_DURATION_SECONDS = 15;

/**
 * Short enough to be invisible to the user, but long enough for React to
 * unmount one module and mount the next module without restarting Bluetooth.
 */
const DEFAULT_STOP_GRACE_PERIOD_MS = 400;

/**
 * Shared application-level EEG stream coordinator.
 *
 * One physical EEG adapter stream can serve many independent modules.
 *
 * Example:
 *
 * BrainAccess 32ch
 *       |
 *       +--> Cortex: all 32 channels
 *       |
 *       +--> SSVEP: O1/O2/Oz/PO3/PO4/POz
 *
 * Important lifecycle rule:
 *
 * - startStream() and stopStream() are serialized;
 * - after the final consumer releases the stream, shutdown is delayed briefly;
 * - if another module acquires EEG during that delay, shutdown is cancelled.
 *
 * This keeps module transitions such as Cortex -> Miner from producing a
 * stop/start race and partial SSVEP trials.
 */
export class EEGStreamService {
  private readonly consumers = new Map<number, ConsumerRecord>();

  private nextConsumerId = 1;

  private activeAdapter: EEGDeviceAdapter | null = null;

  private streamInfo: Readonly<EEGStreamInfo> | null = null;

  private ringBuffer: EEGRingBuffer | null = null;

  private sampleUnsubscribe: (() => void) | null = null;

  /**
   * All physical adapter lifecycle operations run through this queue.
   *
   * This is the critical protection against:
   *
   * old module -> stopStream()
   * new module -> startStream()
   *
   * executing at the same time.
   */
  private lifecycleQueue: Promise<void> = Promise.resolve();

  /**
   * Delayed stop waiting for a possible next module.
   */
  private pendingStop: PendingStop | null = null;

  private readonly bufferDurationSeconds: number;

  private readonly stopGracePeriodMs: number;

  constructor(
    private readonly manager: DeviceManager = deviceManager,
    options: EEGStreamServiceOptions = {},
  ) {
    this.bufferDurationSeconds = options.bufferDurationSeconds ?? DEFAULT_BUFFER_DURATION_SECONDS;

    this.stopGracePeriodMs = options.stopGracePeriodMs ?? DEFAULT_STOP_GRACE_PERIOD_MS;

    if (this.bufferDurationSeconds <= 0) {
      throw new Error("EEG stream buffer duration must be greater than zero.");
    }

    if (this.stopGracePeriodMs < 0) {
      throw new Error("EEG stream stop grace period cannot be negative.");
    }
  }

  /**
   * Acquires access to the shared EEG stream.
   *
   * The first consumer starts the adapter stream.
   * Additional consumers reuse the same physical stream.
   *
   * A pending delayed shutdown is cancelled immediately. This allows the next
   * module to inherit the already-running BrainAccess stream.
   */
  async acquire(request: EEGStreamRequest): Promise<EEGStreamHandle> {
    const adapter = this.manager.getActiveAdapter();

    if (!adapter) {
      throw new Error("No active EEG device is connected.");
    }

    if (!isEEGDeviceAdapter(adapter)) {
      throw new Error(`Active device "${adapter.info.id}" is not an EEG device.`);
    }

    if (adapter.getStatus().state !== "connected") {
      throw new Error(`EEG device "${adapter.info.id}" is not connected.`);
    }

    if (
      this.activeAdapter &&
      this.activeAdapter.info.id !== adapter.info.id &&
      this.consumers.size > 0
    ) {
      throw new Error("Cannot switch EEG devices while stream consumers are active.");
    }

    /**
     * If Cortex has just released EEG and Miner is opening, keep the physical
     * stream alive rather than stopping and immediately restarting it.
     */
    this.cancelPendingStop();

    await this.ensureStreaming(adapter);

    if (!this.streamInfo) {
      throw new Error("EEG stream metadata is unavailable.");
    }

    const selection = this.resolveSelection(this.streamInfo, request.channels);

    const consumerId = this.nextConsumerId++;

    this.consumers.set(consumerId, {
      channels: selection.channels,
      channelIndices: selection.indices,
      listener: request.onBatch,
    });

    /**
     * A final-consumer release can race the asynchronous acquire above.
     * Cancelling again after registration closes that small window.
     */
    this.cancelPendingStop();

    let released = false;

    return {
      id: consumerId,
      channels: selection.channels,
      streamInfo: this.streamInfo,
      release: () => {
        if (released) {
          return Promise.resolve();
        }

        released = true;

        return this.releaseConsumer(consumerId);
      },
    };
  }

  /**
   * Reads the latest history window from the shared ring buffer.
   *
   * The service must already be active through at least one acquired handle.
   */
  getLatestWindow(
    durationSeconds: number,
    requestedChannels: "all" | readonly string[] = "all",
  ): EEGWindow {
    if (durationSeconds <= 0) {
      throw new Error("EEG window duration must be greater than zero.");
    }

    if (!this.streamInfo || !this.ringBuffer) {
      throw new Error("EEG stream is not active.");
    }

    const selection = this.resolveSelection(this.streamInfo, requestedChannels);

    const requestedSamples = Math.ceil(durationSeconds * this.streamInfo.sampleRateHz);

    const buffered = this.ringBuffer.readLatest(requestedSamples, selection.indices);

    return {
      sampleRateHz: this.streamInfo.sampleRateHz,
      sampleCount: buffered.sampleCount,
      channels: selection.channels,
      timestampsMs: buffered.timestampsMs,
      sequenceNumbers: buffered.sequenceNumbers,
      sourceSampleNumbers: buffered.sourceSampleNumbers,
      values: buffered.values,
    };
  }

  getConsumerCount(): number {
    return this.consumers.size;
  }

  isStreaming(): boolean {
    return this.activeAdapter?.isStreaming() ?? false;
  }

  /**
   * Mainly intended for tests and application shutdown.
   *
   * dispose() bypasses the hand-off grace period because the service is being
   * explicitly torn down.
   */
  async dispose(): Promise<void> {
    this.consumers.clear();

    this.cancelPendingStop();

    await this.runLifecycle(async () => {
      await this.deactivateAdapterUnsafe();
    });
  }

  /**
   * Makes sure the requested adapter is streaming.
   *
   * All physical start/stop operations are serialized through lifecycleQueue.
   */
  private async ensureStreaming(adapter: EEGDeviceAdapter): Promise<void> {
    await this.runLifecycle(async () => {
      if (
        this.activeAdapter?.info.id === adapter.info.id &&
        adapter.isStreaming() &&
        this.streamInfo &&
        this.ringBuffer &&
        this.sampleUnsubscribe
      ) {
        return;
      }

      /**
       * Clean up any incomplete or different previous stream before starting.
       * Because this method runs inside lifecycleQueue, stop/start cannot
       * overlap.
       */
      if (this.activeAdapter) {
        await this.deactivateAdapterUnsafe();
      }

      await this.activateAdapterUnsafe(adapter);
    });
  }

  /**
   * Starts one adapter.
   *
   * Must only be called from inside lifecycleQueue.
   */
  private async activateAdapterUnsafe(adapter: EEGDeviceAdapter): Promise<void> {
    const streamInfo = await adapter.getStreamInfo();

    this.validateStreamInfo(streamInfo);

    const capacitySamples = Math.max(
      1,
      Math.ceil(streamInfo.sampleRateHz * this.bufferDurationSeconds),
    );

    const ringBuffer = new EEGRingBuffer(streamInfo.channels.length, capacitySamples);

    /**
     * Publish the stream state before startStream(), because the adapter can
     * begin emitting samples immediately during startup.
     */
    this.activeAdapter = adapter;
    this.streamInfo = streamInfo;
    this.ringBuffer = ringBuffer;

    const unsubscribe = adapter.subscribeSamples((batch) => {
      this.handleBatch(batch);
    });

    this.sampleUnsubscribe = unsubscribe;

    try {
      await adapter.startStream();

      logger.info(
        "EEGStreamService",
        `EEG stream started: ${adapter.info.id} (${streamInfo.sampleRateHz} Hz, ${streamInfo.channels.length} channels)`,
      );
    } catch (error) {
      unsubscribe();

      if (this.sampleUnsubscribe === unsubscribe) {
        this.sampleUnsubscribe = null;
      }

      if (this.activeAdapter === adapter) {
        this.activeAdapter = null;
        this.streamInfo = null;
        this.ringBuffer = null;
      }

      throw error;
    }
  }

  /**
   * Stops the current physical EEG stream.
   *
   * Must only be called from inside lifecycleQueue.
   */
  private async deactivateAdapterUnsafe(): Promise<void> {
    const adapter = this.activeAdapter;
    const unsubscribe = this.sampleUnsubscribe;

    if (!adapter) {
      unsubscribe?.();

      this.sampleUnsubscribe = null;
      this.streamInfo = null;
      this.ringBuffer = null;

      return;
    }

    /**
     * Stop forwarding samples before shutting down the physical stream.
     * The adapter lifecycle itself remains serialized, so a new start cannot
     * begin until this stop completes.
     */
    unsubscribe?.();

    if (this.sampleUnsubscribe === unsubscribe) {
      this.sampleUnsubscribe = null;
    }

    try {
      if (adapter.isStreaming()) {
        await adapter.stopStream();

        logger.info("EEGStreamService", `EEG stream stopped: ${adapter.info.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error(
        "EEGStreamService",
        `Failed to stop EEG stream "${adapter.info.id}": ${message}`,
      );

      throw error;
    } finally {
      /**
       * lifecycleQueue prevents another adapter activation from running in
       * parallel, but the identity check also protects against stale cleanup.
       */
      if (this.activeAdapter === adapter) {
        this.activeAdapter = null;
        this.streamInfo = null;
        this.ringBuffer = null;
      }
    }
  }

  /**
   * Removes one consumer.
   *
   * The final consumer does not stop Bluetooth immediately. A short delayed
   * stop is scheduled so another module can acquire the same stream.
   */
  private releaseConsumer(consumerId: number): Promise<void> {
    const removed = this.consumers.delete(consumerId);

    if (!removed) {
      return Promise.resolve();
    }

    /**
     * Do not stop the physical EEG stream when a module closes.
     *
     * BrainAccess remains streaming while the device is connected to KNeuron.
     * Modules only attach and detach their own consumers.
     *
     * This prevents repeated Bluetooth stop/start cycles during:
     *
     * Cortex -> Miner
     * Miner -> Cortex
     * Cortex -> Dashboard -> Cortex
     *
     * The stream is still stopped by dispose() or when the device itself is
     * disconnected.
     */
    return Promise.resolve();
  }

  /**
   * Cancels a delayed shutdown when a new module wants EEG.
   */
  private cancelPendingStop(): void {
    const pending = this.pendingStop;

    if (!pending) {
      return;
    }

    pending.cancelled = true;

    if (pending.timer) {
      clearTimeout(pending.timer);
      pending.timer = null;
    }

    /**
     * release() may be awaiting the pending stop. Cancellation means the
     * hand-off succeeded, so that release operation is complete.
     */
    pending.resolve();

    if (this.pendingStop === pending) {
      this.pendingStop = null;
    }
  }

  /**
   * Serializes adapter lifecycle operations.
   *
   * The queue is kept alive even when an operation rejects, so one failed
   * stop/start does not permanently poison future module transitions.
   */
  private runLifecycle<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.lifecycleQueue.then(operation);

    this.lifecycleQueue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private handleBatch(batch: Readonly<EEGSampleBatch>): void {
    if (!this.streamInfo || !this.ringBuffer) {
      return;
    }

    try {
      if (batch.sampleRateHz !== this.streamInfo.sampleRateHz) {
        throw new Error(
          `EEG sample rate changed from ${this.streamInfo.sampleRateHz} Hz to ${batch.sampleRateHz} Hz.`,
        );
      }

      if (batch.channelCount !== this.streamInfo.channels.length) {
        throw new Error(
          `EEG batch channel count changed from ${this.streamInfo.channels.length} to ${batch.channelCount}.`,
        );
      }

      this.ringBuffer.push(batch);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error("EEGStreamService", `Rejected EEG batch: ${message}`);

      return;
    }

    /**
     * One module callback must not be able to prevent other consumers from
     * receiving the same EEG batch.
     */
    for (const [consumerId, consumer] of this.consumers.entries()) {
      if (!consumer.listener) {
        continue;
      }

      const consumerBatch: EEGConsumerBatch = {
        sequenceStart: batch.sequenceStart,
        timestampStartMs: batch.timestampStartMs,
        sampleRateHz: batch.sampleRateHz,
        sampleCount: batch.sampleCount,
        channels: consumer.channels,
        values: consumer.channelIndices.map((channelIndex) => [...batch.values[channelIndex]]),
        sourceSampleNumberStart: batch.sourceSampleNumberStart,
      };

      try {
        consumer.listener(consumerBatch);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        logger.error("EEGStreamService", `EEG consumer ${consumerId} rejected a batch: ${message}`);
      }
    }
  }

  private resolveSelection(
    streamInfo: Readonly<EEGStreamInfo>,
    requested: "all" | readonly string[],
  ): {
    channels: readonly Readonly<EEGChannelInfo>[];
    indices: readonly number[];
  } {
    if (requested === "all") {
      return {
        channels: streamInfo.channels.map((channel) => ({
          ...channel,
        })),
        indices: streamInfo.channels.map((_, index) => index),
      };
    }

    const resolution = resolveEEGChannels(streamInfo, requested);

    if (!resolution.complete) {
      throw new Error(`Missing required EEG channels: ${resolution.missingLabels.join(", ")}.`);
    }

    return {
      channels: resolution.resolved.map((entry) => ({
        ...entry.channel,
      })),
      indices: resolution.resolved.map((entry) => entry.streamIndex),
    };
  }

  private validateStreamInfo(streamInfo: Readonly<EEGStreamInfo>): void {
    if (streamInfo.sampleRateHz <= 0) {
      throw new Error("EEG stream sample rate must be greater than zero.");
    }

    if (streamInfo.channels.length === 0) {
      throw new Error("EEG stream must expose at least one channel.");
    }

    const labels = new Set<string>();

    streamInfo.channels.forEach((channel, index) => {
      /**
       * Normalized channel index must correspond directly to the
       * values[][] array position.
       */
      if (channel.index !== index) {
        throw new Error(
          `EEG channel "${channel.label}" has index ${channel.index}, expected ${index}.`,
        );
      }

      const normalizedLabel = channel.label.trim().toUpperCase();

      if (labels.has(normalizedLabel)) {
        throw new Error(`Duplicate EEG channel label "${channel.label}".`);
      }

      labels.add(normalizedLabel);
    });
  }
}

/**
 * Shared application-wide EEG stream service.
 */
export const eegStreamService = new EEGStreamService();
