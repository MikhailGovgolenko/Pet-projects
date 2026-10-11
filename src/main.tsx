import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./core/i18n";
import "./core/theme.css";
import "./core/fonts.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
