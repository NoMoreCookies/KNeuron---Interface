import type { DeviceAdapter } from "./contracts/DeviceAdapter";

/**
 * Listener notified whenever the set of registered device adapters changes.
 */
export type DeviceRegistryListener = (adapters: readonly DeviceAdapter[]) => void;

/**
 * Device IDs use the same predictable slug-like convention as KNeuron modules.
 *
 * Examples:
 * simulation-eeg
 * brainaccess-maxi
 * openbci-cyton
 */
const DEVICE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Stores device adapters available to KNeuron.
 *
 * DeviceRegistry is responsible only for registration/discovery.
 * Connection lifecycle belongs to DeviceManager.
 *
 * Adding a new hardware implementation should not require modifying
 * this class.
 */
export class DeviceRegistry {
  private readonly adapters = new Map<string, DeviceAdapter>();

  private readonly listeners = new Set<DeviceRegistryListener>();

  /**
   * Registers a device adapter.
   *
   * Every adapter must expose a unique, stable ID.
   */
  register(adapter: DeviceAdapter): DeviceAdapter {
    const { id, name } = adapter.info;

    if (!DEVICE_ID_PATTERN.test(id)) {
      throw new Error(
        `Invalid device ID "${id}". Device IDs must contain only lowercase letters, numbers and hyphens.`,
      );
    }

    if (!name.trim()) {
      throw new Error(`Device "${id}" must define a name.`);
    }

    if (this.adapters.has(id)) {
      throw new Error(`Device with ID "${id}" is already registered.`);
    }

    this.adapters.set(id, adapter);

    this.emit();

    return adapter;
  }

  /**
   * Removes an adapter from the registry.
   *
   * DeviceManager must ensure that a connected device is disconnected
   * before its adapter is removed.
   */
  unregister(deviceId: string): boolean {
    const removed = this.adapters.delete(deviceId);

    if (removed) {
      this.emit();
    }

    return removed;
  }

  /**
   * Returns one adapter by its stable ID.
   */
  get(deviceId: string): DeviceAdapter | undefined {
    return this.adapters.get(deviceId);
  }

  /**
   * Returns all currently registered adapters.
   *
   * The returned array is a new array so callers cannot mutate
   * the registry's internal collection.
   */
  getAll(): DeviceAdapter[] {
    return [...this.adapters.values()];
  }

  /**
   * Checks whether an adapter is already registered.
   */
  has(deviceId: string): boolean {
    return this.adapters.has(deviceId);
  }

  /**
   * Subscribes to registry changes.
   */
  subscribe(listener: DeviceRegistryListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getAll();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

/**
 * Application-wide device adapter registry.
 */
export const deviceRegistry = new DeviceRegistry();
