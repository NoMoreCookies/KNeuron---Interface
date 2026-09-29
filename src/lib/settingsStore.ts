import { DEFAULT_SETTINGS } from "../config/defaultSettings";

import type { AppSettings } from "../types/settings";

const STORAGE_KEY = "kneuron.settings.v1";

type SettingsListener = (
  settings: AppSettings,
) => void;

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
 * Runtime validation for data loaded from browser storage.
 *
 * localStorage contains untrusted data from the application's perspective.
 * Never assume that persisted JSON still matches the current TypeScript type.
 */
function isAppSettings(
  value: unknown,
): value is AppSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Partial<AppSettings>;

  const validScale =
    candidate.uiScale === 90 ||
    candidate.uiScale === 100 ||
    candidate.uiScale === 110;

  return (
    typeof candidate.animationsEnabled === "boolean" &&
    validScale &&
    typeof candidate.confirmBeforeClosingModule === "boolean" &&
    typeof candidate.showDebugInformation === "boolean"
  );
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
 * It deliberately contains no React code.
 */
export class SettingsStore {
  private settings: AppSettings;

  private readonly listeners =
    new Set<SettingsListener>();

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
   * Updates only the provided settings fields.
   */
  update(
    patch: Partial<AppSettings>,
  ): AppSettings {
    const nextSettings: AppSettings = {
      ...this.settings,
      ...patch,
    };

    if (!isAppSettings(nextSettings)) {
      throw new Error(
        "Attempted to save invalid KNeuron settings.",
      );
    }

    this.settings = nextSettings;

    this.persist();
    this.emit();

    return this.get();
  }

  /**
   * Restores application defaults.
   */
  reset(): AppSettings {
    this.settings = createDefaultSettings();

    this.persist();
    this.emit();

    return this.get();
  }

  /**
   * Subscribes to settings changes.
   */
  subscribe(
    listener: SettingsListener,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private load(): AppSettings {
    try {
      const raw =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (!raw) {
        return createDefaultSettings();
      }

      const parsed: unknown =
        JSON.parse(raw);

      if (!isAppSettings(parsed)) {
        console.warn(
          "[KNeuron] Invalid persisted settings. Falling back to defaults.",
        );

        return createDefaultSettings();
      }

      return parsed;
    } catch (error) {
      console.warn(
        "[KNeuron] Failed to load settings. Falling back to defaults.",
        error,
      );

      return createDefaultSettings();
    }
  }

  private persist(): void {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.settings),
      );
    } catch (error) {
      console.error(
        "[KNeuron] Failed to persist settings.",
        error,
      );
    }
  }

  private emit(): void {
    const snapshot = this.get();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const settingsStore =
  new SettingsStore();