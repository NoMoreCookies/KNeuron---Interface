import { logger } from "../../lib/logger";

import type { DeviceAdapter, DeviceUnsubscribe } from "./contracts/DeviceAdapter";

import type { DeviceInfo, DeviceStatus } from "./models/device";

import { DeviceRegistry, deviceRegistry } from "./deviceRegistry";

/**
 * Immutable snapshot exposed by DeviceManager.
 *
 * React and other consumers should observe this structure instead of
 * maintaining their own interpretation of the active device lifecycle.
 */
export interface DeviceManagerSnapshot {
  /**
   * Devices currently available in DeviceRegistry.
   */
  devices: readonly Readonly<DeviceInfo>[];

  /**
   * Adapter currently managed by DeviceManager.
   *
   * Null means no device is active.
   */
  activeDeviceId: string | null;

  /**
   * Metadata of the currently active device.
   */
  activeDeviceInfo: Readonly<DeviceInfo> | null;

  /**
   * Current connection state of the active device.
   */
  activeStatus: Readonly<DeviceStatus> | null;

  /**
   * True while a connect/disconnect operation is running.
   *
   * UI controls should normally be disabled while this is true.
   */
  busy: boolean;
}

export type DeviceManagerListener = (snapshot: DeviceManagerSnapshot) => void;

/**
 * Coordinates device connection lifecycle.
 *
 * DeviceManager knows only the generic DeviceAdapter contract.
 *
 * It must never contain hardware-specific branches such as:
 *
 *   if (deviceId === "brainaccess") ...
 *   if (deviceId === "openbci") ...
 *
 * Those details belong inside adapter implementations.
 */
export class DeviceManager {
  private activeDeviceId: string | null = null;

  private busy = false;

  private readonly listeners = new Set<DeviceManagerListener>();

  private activeStatusUnsubscribe: DeviceUnsubscribe | null = null;

  private readonly registryUnsubscribe: () => void;

  constructor(private readonly registry: DeviceRegistry = deviceRegistry) {
    /**
     * Registry changes should automatically propagate to DeviceManager
     * subscribers so the UI does not need to observe two different stores.
     */
    this.registryUnsubscribe = this.registry.subscribe(() => {
      this.emit();
    });
  }

  /**
   * Returns an immutable snapshot of the Device Layer state.
   */
  getSnapshot(): DeviceManagerSnapshot {
    const activeAdapter = this.getActiveAdapter();

    return {
      devices: this.registry.getAll().map((adapter) => ({
        ...adapter.info,
      })),

      activeDeviceId: this.activeDeviceId,

      activeDeviceInfo: activeAdapter
        ? {
            ...activeAdapter.info,
          }
        : null,

      activeStatus: activeAdapter
        ? {
            ...activeAdapter.getStatus(),
          }
        : null,

      busy: this.busy,
    };
  }

  /**
   * Returns the currently active adapter.
   *
   * This method will later be used by higher-level services such as
   * EEGStreamService without exposing manufacturer-specific APIs.
   */
  getActiveAdapter(): DeviceAdapter | null {
    if (!this.activeDeviceId) {
      return null;
    }

    return this.registry.get(this.activeDeviceId) ?? null;
  }

  /**
   * Connects one registered device.
   *
   * KNeuron currently supports one active physical device at a time.
   * Connecting another adapter first disconnects the currently active one.
   */
  async connect(deviceId: string): Promise<Readonly<DeviceStatus>> {
    if (this.busy) {
      throw new Error("Another device operation is already in progress.");
    }

    const adapter = this.registry.get(deviceId);

    if (!adapter) {
      throw new Error(`Device "${deviceId}" is not registered.`);
    }

    const current = this.getActiveAdapter();

    /**
     * Connecting the already connected device is a safe no-op.
     */
    if (current?.info.id === deviceId && current.getStatus().state === "connected") {
      return {
        ...current.getStatus(),
      };
    }

    this.busy = true;
    this.emit();

    try {
      /**
       * KNeuron currently permits one active device.
       */
      if (current && current.info.id !== deviceId) {
        await this.disconnectAdapter(current);

        this.clearActiveDevice();
      }

      this.bindActiveDevice(adapter);

      logger.info("DeviceManager", `Connecting device: ${deviceId}`);

      await adapter.connect();

      const status = {
        ...adapter.getStatus(),
      };

      logger.info("DeviceManager", `Device connected: ${deviceId}`);

      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error("DeviceManager", `Failed to connect device "${deviceId}": ${message}`);

      throw error;
    } finally {
      this.busy = false;
      this.emit();
    }
  }

  /**
   * Disconnects the currently active device.
   *
   * Calling disconnect when nothing is active is intentionally a no-op.
   */
  async disconnect(): Promise<void> {
    if (this.busy) {
      throw new Error("Another device operation is already in progress.");
    }

    const adapter = this.getActiveAdapter();

    if (!adapter) {
      return;
    }

    this.busy = true;
    this.emit();

    try {
      logger.info("DeviceManager", `Disconnecting device: ${adapter.info.id}`);

      await this.disconnectAdapter(adapter);

      logger.info("DeviceManager", `Device disconnected: ${adapter.info.id}`);

      this.clearActiveDevice();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error("DeviceManager", `Failed to disconnect device "${adapter.info.id}": ${message}`);

      throw error;
    } finally {
      this.busy = false;
      this.emit();
    }
  }

  /**
   * Observes all DeviceManager state changes.
   */
  subscribe(listener: DeviceManagerListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Releases subscriptions owned by this manager.
   *
   * The application singleton normally lives for the entire KNeuron process,
   * but this method is useful for automated tests and future isolated manager
   * instances.
   */
  dispose(): void {
    this.clearActiveDevice();

    this.registryUnsubscribe();

    this.listeners.clear();
  }

  /**
   * Disconnects an adapter only when necessary.
   */
  private async disconnectAdapter(adapter: DeviceAdapter): Promise<void> {
    if (adapter.getStatus().state === "disconnected") {
      return;
    }

    await adapter.disconnect();
  }

  /**
   * Makes an adapter the active device and forwards its status updates.
   */
  private bindActiveDevice(adapter: DeviceAdapter): void {
    this.activeStatusUnsubscribe?.();

    this.activeDeviceId = adapter.info.id;

    this.activeStatusUnsubscribe = adapter.subscribeStatus(() => {
      /**
       * Ignore late events from an adapter that is no longer active.
       */
      if (this.activeDeviceId === adapter.info.id) {
        this.emit();
      }
    });

    this.emit();
  }

  /**
   * Removes the active device binding without modifying the adapter itself.
   */
  private clearActiveDevice(): void {
    this.activeStatusUnsubscribe?.();

    this.activeStatusUnsubscribe = null;

    this.activeDeviceId = null;

    this.emit();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

/**
 * Application-wide DeviceManager.
 */
export const deviceManager = new DeviceManager();
