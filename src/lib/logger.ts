import type { LogEntry, LogLevel } from "../types/logging";

type LogListener = (entries: readonly LogEntry[]) => void;

const MAX_LOG_ENTRIES = 200;

class Logger {
  private entries: LogEntry[] = [];

  private readonly listeners = new Set<LogListener>();

  private nextId = 1;

  debug(source: string, message: string): void {
    this.write("debug", source, message);
  }

  info(source: string, message: string): void {
    this.write("info", source, message);
  }

  warning(source: string, message: string): void {
    this.write("warning", source, message);
  }

  error(source: string, message: string): void {
    this.write("error", source, message);
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];

    this.emit();
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private write(level: LogLevel, source: string, message: string): void {
    const entry: LogEntry = {
      id: this.nextId++,
      timestamp: Date.now(),
      level,
      source,
      message,
    };

    this.entries = [...this.entries, entry].slice(-MAX_LOG_ENTRIES);

    this.writeToConsole(entry);

    this.emit();
  }

  private writeToConsole(entry: LogEntry): void {
    const prefix = `[KNeuron][${entry.source}]`;

    switch (entry.level) {
      case "debug":
        console.debug(prefix, entry.message);
        break;

      case "info":
        console.info(prefix, entry.message);
        break;

      case "warning":
        console.warn(prefix, entry.message);
        break;

      case "error":
        console.error(prefix, entry.message);
        break;
    }
  }

  private emit(): void {
    const snapshot = this.getEntries();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const logger = new Logger();
