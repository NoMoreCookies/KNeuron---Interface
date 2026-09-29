import { useState } from "react";

import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { DevicePanel } from "./components/DevicePanel";

import { Dashboard } from "./features/dashboard/Dashboard";

import { ModuleHost } from "./features/modules/ModuleHost";
import { ModuleErrorBoundary } from "./features/modules/ModuleErrorBoundary";

import {
  closeModule,
  launchModule,
} from "./features/modules/moduleLauncher";

import type {
  AppRoute,
  ShellPage,
} from "./types/navigation";

/**
 * Placeholder used by shell-level pages that are not implemented yet.
 */
function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">
        KNEURON
      </span>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

      <div className="architecture-note">
        <strong>
          Shell boundary
        </strong>

        <span>
          This screen belongs to the KNeuron Shell and remains independent
          from individual modules.
        </span>
      </div>
    </section>
  );
}

/**
 * Root component of the KNeuron desktop shell.
 */
export default function App() {
  const [route, setRoute] = useState<AppRoute>({
    kind: "shell",
    page: "dashboard",
  });

  /**
   * Starts a module first.
   *
   * Navigation happens only after ModuleManager confirms that the module
   * reached the running state.
   */
  async function handleOpenModule(
    moduleId: string,
  ): Promise<void> {
    try {
      await launchModule(moduleId);

      setRoute({
        kind: "module",
        moduleId,
      });
    } catch (error) {
      console.error(
        `[KNeuron] Failed to launch module "${moduleId}".`,
        error,
      );
    }
  }

  /**
   * Leaves an active module and returns to the Dashboard.
   */
  function handleReturnToDashboard(): void {
    if (route.kind === "module") {
      try {
        closeModule(route.moduleId);
      } catch (error) {
        console.error(
          `[KNeuron] Failed to close module "${route.moduleId}".`,
          error,
        );
      }
    }

    setRoute({
      kind: "shell",
      page: "dashboard",
    });
  }

  /**
   * Handles shell navigation from Sidebar.
   *
   * Navigating away while a module is open first stops the active module.
   */
  function handleShellNavigation(
    page: ShellPage,
  ): void {
    if (route.kind === "module") {
      try {
        closeModule(route.moduleId);
      } catch (error) {
        console.error(
          `[KNeuron] Failed to close active module.`,
          error,
        );
      }
    }

    setRoute({
      kind: "shell",
      page,
    });
  }

  /**
   * Renders the central content area.
   */
  function renderContent() {
    if (route.kind === "module") {
      return (
        <ModuleErrorBoundary
          key={route.moduleId}
          moduleId={route.moduleId}
          onReturnToDashboard={handleReturnToDashboard}
        >
          <ModuleHost
            moduleId={route.moduleId}
            onBack={handleReturnToDashboard}
          />
        </ModuleErrorBoundary>
      );
    }

    switch (route.page) {
      case "dashboard":
        return (
          <Dashboard
            onOpenModule={handleOpenModule}
          />
        );

      case "device":
        return (
          <PlaceholderPage
            title="Device"
            description="EEG devices and device adapters will appear here once the KNeuron Device Layer is integrated."
          />
        );

      case "settings":
        return (
          <PlaceholderPage
            title="Settings"
            description="Global KNeuron settings will live here. Module-specific settings remain inside their respective modules."
          />
        );

      default: {
        const exhaustiveCheck: never = route.page;

        return exhaustiveCheck;
      }
    }
  }

  /**
   * While a module is active, Dashboard remains the logical parent
   * navigation item.
   */
  const activeSidebarPage: ShellPage =
    route.kind === "shell"
      ? route.page
      : "dashboard";

  const isModuleOpen = route.kind === "module";
  return (
    <div
      className={
        isModuleOpen
          ? "app-shell app-shell--module-open"
          : "app-shell"
      }
    >
      <TitleBar />

      <Sidebar
        page={activeSidebarPage}
        onNavigate={handleShellNavigation}
      />

      <main className="main-content">
        {renderContent()}
      </main>

      <DevicePanel />
    </div>
  );
}