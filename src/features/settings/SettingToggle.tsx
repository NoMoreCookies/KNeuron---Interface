interface SettingToggleProps {
  checked: boolean;

  onChange: (checked: boolean) => void;

  ariaLabel: string;
}

/**
 * Reusable boolean control used by KNeuron settings.
 *
 * Uses the ARIA switch role so the control is understandable
 * for assistive technologies as well as mouse/keyboard users.
 */
export function SettingToggle({ checked, onChange, ariaLabel }: SettingToggleProps) {
  return (
    <button
      type="button"
      className={checked ? "setting-toggle setting-toggle--enabled" : "setting-toggle"}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
    >
      <span className="setting-toggle__track">
        <span className="setting-toggle__thumb" />
      </span>

      <span className="setting-toggle__value">{checked ? "ON" : "OFF"}</span>
    </button>
  );
}
