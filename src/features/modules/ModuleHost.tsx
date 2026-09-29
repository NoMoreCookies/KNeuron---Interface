import { ArrowLeft } from "lucide-react";

import { useRegisteredModules } from "./useRegisteredModules";

interface ModuleHostProps {
  moduleId: string;

  onBack: () => void;
}

/**
 * Host container for an active KNeuron module.
 *
 * Real module UI will later be mounted inside this component.
 *
 * For now it deliberately renders a development placeholder so the
 * complete module lifecycle and routing can be verified first.
 */
export function ModuleHost({
  moduleId,
  onBack,
}: ModuleHostProps) {
  const modules = useRegisteredModules();

  const registeredModule = modules.find(
    (module) => module.manifest.id === moduleId,
  );

  if (!registeredModule) {
    return (
      <section className="module-host module-host--missing">
        <h1>
          Module not found
        </h1>

        <p>
          The requested module is not registered in KNeuron.
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </section>
    );
  }

  const {
    manifest,
    status,
  } = registeredModule;

  return (
    <section className="module-host">
      <header className="module-host__header">
        <div>
          <button
            type="button"
            className="module-host__back"
            onClick={onBack}
          >
            <ArrowLeft size={16} />

            Back to Dashboard
          </button>

          <span className="eyebrow">
            KNEURON MODULE
          </span>

          <h1>
            {manifest.name}
          </h1>

          <p>
            {manifest.description}
          </p>
        </div>

        <div className="module-host__status">
          <span>
            Runtime
          </span>

          <strong>
            {status}
          </strong>
        </div>
      </header>

      <div className="module-host__placeholder">
        <span className="eyebrow">
          MODULE HOST
        </span>

        <h2>
          {manifest.name} is running
        </h2>

        <p>
          The module runtime is active. Its actual interface will be mounted
          here when this module is integrated with KNeuron.
        </p>

        <code>
          {manifest.entryPoint}
        </code>
      </div>
    </section>
  );
}