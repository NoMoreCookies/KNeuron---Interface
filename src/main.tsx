import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { registerBuiltInDevices } from "./core/devices/registerBuiltInDevices";

import { registerBuiltInModules } from "./features/modules/registerBuiltInModules";

import "./styles/app.css";

/**
 * Register device adapters bundled with KNeuron.
 */
registerBuiltInDevices();

/**
 * Register production modules bundled with KNeuron.
 */
registerBuiltInModules();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);