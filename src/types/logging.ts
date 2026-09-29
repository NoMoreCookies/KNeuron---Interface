export type LogLevel = "debug" | "info" | "warning" | "error";

export interface LogEntry {
  id: number;

  timestamp: number;

  level: LogLevel;

  /**
   * Subsystem producing the message.
   *
   * Examples:
   * Shell
   * ModuleManager
   * DeviceManager
   */
  source: string;

  message: string;
}
