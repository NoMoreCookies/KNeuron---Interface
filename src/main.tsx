import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { APP_CONFIG } from "./config/appConfig";

import { registerBuiltInDevices } from "./core/devices/registerBuiltInDevices";

import { registerBuiltInModules } from "./features/modules/registerBuiltInModules";

import { registerDevelopmentModules } from "./features/modules/registerDevelopmentModules";

import "./styles/app.css";

/**
 * Register device adapters bundled with KNeuron.
 */
registerBuiltInDevices();

/**
 * Register production modules bundled with KNeuron.
 */
registerBuiltInModules();

/**
 * Temporary development modules are available only in development.
 */
if (APP_CONFIG.enableDevelopmentModules) {
  registerDevelopmentModules();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
