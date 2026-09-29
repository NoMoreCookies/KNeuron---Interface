import { useEffect, useState } from "react";

import { settingsStore } from "../../lib/settingsStore";

import type { AppSettings } from "../../types/settings";

/**
 * React adapter for the global KNeuron SettingsStore.
 *
 * SettingsStore deliberately contains no React code.
 * This hook translates store notifications into React state updates.
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => settingsStore.get());

  useEffect(() => {
    const unsubscribe = settingsStore.subscribe((nextSettings) => {
      setSettings(nextSettings);
    });

    return unsubscribe;
  }, []);

  /**
   * Updates one or more settings.
   */
  function updateSettings(patch: Partial<AppSettings>): void {
    settingsStore.update(patch);
  }

  /**
   * Restores application defaults.
   */
  function resetSettings(): void {
    settingsStore.reset();
  }

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
