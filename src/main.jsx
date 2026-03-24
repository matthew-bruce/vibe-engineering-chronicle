import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../vibe-journey.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
