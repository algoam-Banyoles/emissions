import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import "@/i18n/config";
import "@/index.css";
import "leaflet/dist/leaflet.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No s'ha trobat l'element root.");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
