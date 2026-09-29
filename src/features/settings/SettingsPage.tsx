import { APP_CONFIG } from "../../config/appConfig";

import { SettingToggle } from "./SettingToggle";
import { useSettings } from "./useSettings";

import type { UIScale } from "../../types/settings";

/**
 * Global settings screen for the KNeuron desktop shell.
 *
 * Module-specific configuration must not be placed here.
 */
export function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettings();

  function handleScaleChange(
    value: string,
  ): void {
    const numericValue = Number(value);

    if (
      numericValue !== 90 &&
      numericValue !== 100 &&
      numericValue !== 110
    ) {
      return;
    }

    updateSettings({
      uiScale: numericValue as UIScale,
    });
  }

  function handleReset(): void {
    const confirmed = window.confirm(
      "Reset all KNeuron settings to their default values?",
    );

    if (!confirmed) {
      return;
    }

    resetSettings();
  }

  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <span className="eyebrow">
          KNEURON
        </span>

        <h1>
          Settings
        </h1>

        <p>
          Configure global KNeuron application behaviour.
        </p>
      </header>

      {/* GENERAL */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <h2>
            General
          </h2>

          <p>
            Global behaviour of the KNeuron desktop application.
          </p>
        </div>

        <div className="settings-panel">
          <div className="settings-row">
            <div>
              <strong>
                Confirm module exit
              </strong>

              <span>
                Ask before leaving a running module.
              </span>
            </div>

            <SettingToggle
              checked={
                settings.confirmBeforeClosingModule
              }
              ariaLabel="Confirm before leaving a running module"
              onChange={(checked) => {
                updateSettings({
                  confirmBeforeClosingModule: checked,
                });
              }}
            />
          </div>
        </div>
      </section>

      {/* APPEARANCE */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <h2>
            Appearance
          </h2>

          <p>
            Interface presentation and motion preferences.
          </p>
        </div>

        <div className="settings-panel">
          <div className="settings-row">
            <div>
              <strong>
                Animations
              </strong>

              <span>
                Enable interface transitions and animations.
              </span>
            </div>

            <SettingToggle
              checked={settings.animationsEnabled}
              ariaLabel="Enable interface animations"
              onChange={(checked) => {
                updateSettings({
                  animationsEnabled: checked,
                });
              }}
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>
                UI scale
              </strong>

              <span>
                Global interface scaling.
              </span>
            </div>

            <select
              className="setting-select"
              value={settings.uiScale}
              aria-label="UI scale"
              onChange={(event) => {
                handleScaleChange(
                  event.target.value,
                );
              }}
            >
              <option value={90}>
                90%
              </option>

              <option value={100}>
                100%
              </option>

              <option value={110}>
                110%
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* DEVELOPER */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <h2>
            Developer
          </h2>

          <p>
            Development and diagnostic information.
          </p>
        </div>

        <div className="settings-panel">
          <div className="settings-row">
            <div>
              <strong>
                Debug information
              </strong>

              <span>
                Display additional runtime diagnostic information.
              </span>
            </div>

            <SettingToggle
              checked={
                settings.showDebugInformation
              }
              ariaLabel="Show debug information"
              onChange={(checked) => {
                updateSettings({
                  showDebugInformation: checked,
                });
              }}
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <h2>
            About
          </h2>

          <p>
            Application and licensing information.
          </p>
        </div>

        <div className="settings-panel">
          <div className="settings-row">
            <div>
              <strong>
                {APP_CONFIG.name}
              </strong>

              <span>
                Modular Brain-Computer Interface
              </span>
            </div>

            <code>
              v{APP_CONFIG.version}
            </code>
          </div>

          <div className="settings-row">
            <div>
              <strong>
                Environment
              </strong>

              <span>
                Current application runtime environment.
              </span>
            </div>

            <code>
              {APP_CONFIG.isDevelopment
                ? "Development"
                : "Production"}
            </code>
          </div>

          <div className="settings-row">
            <div>
              <strong>
                License
              </strong>

              <span>
                License governing this KNeuron build.
              </span>
            </div>

            <code>
              {APP_CONFIG.license}
            </code>
          </div>
        </div>
      </section>

      {/* RESET */}

      <div className="settings-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={handleReset}
        >
          Reset settings
        </button>
      </div>
    </section>
  );
}