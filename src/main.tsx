import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { APP_CONFIG } from "./config/appConfig";
import { registerDevelopmentModules } from "./features/modules/registerDevelopmentModules";

import "./styles/app.css";

/**
 * Development modules are registered only while KNeuron
 * is running in development mode.
 *
 * Production builds start with a clean module registry.
 */
if (APP_CONFIG.enableDevelopmentModules) {
  registerDevelopmentModules();
}

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);