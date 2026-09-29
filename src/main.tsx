import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { registerDevelopmentModules } from "./features/modules/registerDevelopmentModules";

import "./styles/app.css";

/**
 * Register development modules before React renders the Dashboard.
 *
 * In production this bootstrap step will eventually be replaced by
 * real module discovery/loading.
 */
registerDevelopmentModules();

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);