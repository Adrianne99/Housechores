import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./lib/api"; // configures axios (base URL, cookies, 401 handling)
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
