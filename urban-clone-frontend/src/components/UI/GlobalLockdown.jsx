import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import io from "socket.io-client";
import AuthContext from "../../context/AuthContext";
import { FiAlertTriangle } from "react-icons/fi";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const socket = io.connect(import.meta.env.VITE_API_URL);

const GlobalLockdown = () => {
  const { user } = useContext(AuthContext);
  const [appConfig, setAppConfig] = useState({
    isOperationsPaused: false,
    emergencyMessage: "",
  });

  useEffect(() => {
    // 1. Fetch initial status on load
    axios
      .get("/api/config")
      .then((res) => setAppConfig(res.data))
      .catch((err) => console.log(err));

    // 2. Listen for the WebSocket instant trigger
    const configHandler = (data) => {
      setAppConfig(data);
    };
    socket.on("app_config_update", configHandler);
    return () => socket.off("app_config_update", configHandler);
  }, []);

  // 🌟 THE BYPASS LOGIC: If app is running normally, OR if user is an Admin, render nothing (let them in)
  if (!appConfig.isOperationsPaused || user?.role === "admin") {
    return null;
  }

  // 🌟 THE LOCKDOWN SCREEN: Blocks the entire screen for Customers and Providers
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#0f172a", // Dark mode background
        color: "white",
        zIndex: 999999, // Absolute highest z-index so it covers EVERYTHING
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <FiAlertTriangle size={80} className="text-warning mb-4" />
      </motion.div>
      <h1 className="fw-bold mb-3" style={{ fontSize: "3rem" }}>
        We'll be right back!
      </h1>
      <p className="lead opacity-75" style={{ maxWidth: "600px" }}>
        {appConfig.emergencyMessage ||
          "Our systems are currently paused for emergency maintenance. Please check back shortly."}
      </p>

      <div
        className="mt-5 pt-5 border-top border-secondary w-100"
        style={{ maxWidth: "400px" }}
      >
        <p className="small text-white-50 mb-0">UrbanClone Technologies</p>
      </div>
    </motion.div>
  );
};

export default GlobalLockdown;
