import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

// 🌟 NEW: IMPORT THE PWA SERVICE WORKER 🌟
import { registerSW } from "virtual:pwa-register";
import axios from "axios"; // 🌟 NEW: Import axios
// 🌟 NEW: Set Global Default URL for all API calls
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

// Start the background worker immediately
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
