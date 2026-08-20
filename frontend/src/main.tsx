import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root container element '#root' not found in HTML document.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
