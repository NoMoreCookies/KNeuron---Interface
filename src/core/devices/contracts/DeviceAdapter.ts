import type { DeviceInfo, DeviceStatus } from "../models/device";

/**
 * Removes a previously registered subscription.
 */
export type DeviceUnsubscribe = () => void;

/**
 * Listener notified whenever an adapter publishes a new connection state.
 */
export type DeviceStatusListener = (status: Readonly<DeviceStatus>) => void;

/**
 * Base contract implemented by every device supported by KNeuron.
 *
 * DeviceManager depends only on this interface. It must never contain
 * manufacturer-specific branches such as:
 *
 *   if (device === "BrainAccess") ...
 *   if (device === "OpenBCI") ...
 *
 * Hardware-specific behaviour belongs inside adapter implementations.
 */
export interface DeviceAdapter {
  /**
   * Immutable device metadata.
   *
   * DeviceRegistry uses info.id as the unique adapter identifier.
   */
  readonly info: Readonly<DeviceInfo>;

  /**
   * Returns the current connection state.
   *
   * Consumers receive a snapshot and must not mutate internal adapter state.
   */
  getStatus(): Readonly<DeviceStatus>;

  /**
   * Establishes the device connection.
   *
   * The Promise resolves only after the adapter has successfully reached
   * the connected state.
   *
   * Implementations should reject the Promise when connection fails.
   */
  connect(): Promise<void>;

  /**
   * Gracefully closes the connection.
   *
   * Implementations should leave the adapter in the disconnected state
   * when the operation succeeds.
   */
  disconnect(): Promise<void>;

  /**
   * Subscribes to connection state changes.
   *
   * The returned function must remove the listener.
   */
  subscribeStatus(listener: DeviceStatusListener): DeviceUnsubscribe;
}
