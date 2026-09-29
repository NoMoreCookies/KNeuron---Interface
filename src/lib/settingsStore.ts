import { DEFAULT_SETTINGS } from "../config/defaultSettings";

import type { AppSettings } from "../types/settings";

const STORAGE_KEY = "kneuron.settings.v1";

type SettingsListener = (settings: AppSettings) => void;

/**
 * Creates an independent copy of the default settings.
 *
 * Returning a new object prevents callers from accidentally mutating
 * DEFAULT_SETTINGS.
 */
function createDefaultSettings(): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
  };
}

/**
 * Converts persisted data into the current AppSettings schema.
 *
 * Persisted settings must never be trusted blindly because:
 * - the user may edit localStorage,
 * - older KNeuron versions may contain obsolete fields,
 * - the settings schema may change over time.
 *
 * Extra legacy properties are intentionally ignored.
 */
function parseAppSettings(value: unknown): AppSettings | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.confirmBeforeClosingModule !== "boolean" ||
    typeof candidate.showDebugInformation !== "boolean"
  ) {
    return null;
  }

  return {
    confirmBeforeClosingModule: candidate.confirmBeforeClosingModule,

    showDebugInformation: candidate.showDebugInformation,
  };
}

/**
 * Central persistence layer for global KNeuron settings.
 *
 * Responsibilities:
 * - load persisted settings,
 * - validate persisted settings,
 * - update settings,
 * - reset settings,
 * - notify subscribers.
 *
 * This class deliberately contains no React code.
 */
export class SettingsStore {
  private settings: AppSettings;

  private readonly listeners = new Set<SettingsListener>();

  constructor() {
    this.settings = this.load();
  }

  /**
   * Returns a copy so consumers cannot mutate internal state directly.
   */
  get(): AppSettings {
    return {
      ...this.settings,
    };
  }

  /**
   * Updates one or more settings.
   */
  update(patch: Partial<AppSettings>): AppSettings {
    const candidate = {
      ...this.settings,
      ...patch,
    };

    const nextSettings = parseAppSettings(candidate);

    if (!nextSettings) {
      throw new Error("Attempted to save invalid KNeuron settings.");
    }

    this.settings = nextSettings;

    this.persist();
    this.emit();

    return this.get();
  }

  /**
   * Restores the default application settings.
   */
  reset(): AppSettings {
    this.settings = createDefaultSettings();

    this.persist();
    this.emit();

    return this.get();
  }

  /**
   * Subscribes to settings changes.
   *
   * The returned callback removes the listener.
   */
  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Loads and validates persisted settings.
   *
   * Older settings objects may still contain removed properties such as
   * uiScale or animationsEnabled. parseAppSettings() intentionally strips
   * those fields instead of treating the entire object as invalid.
   */
  private load(): AppSettings {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return createDefaultSettings();
      }

      const parsed: unknown = JSON.parse(raw);

      const settings = parseAppSettings(parsed);

      if (!settings) {
        console.warn("[KNeuron] Invalid persisted settings. Falling back to defaults.");

        return createDefaultSettings();
      }

      return settings;
    } catch (error) {
      console.warn("[KNeuron] Failed to load settings. Falling back to defaults.", error);

      return createDefaultSettings();
    }
  }

  /**
   * Persists the current settings snapshot.
   */
  private persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("[KNeuron] Failed to persist settings.", error);
    }
  }

  /**
   * Notifies all active subscribers.
   */
  private emit(): void {
    const snapshot = this.get();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const settingsStore = new SettingsStore();
