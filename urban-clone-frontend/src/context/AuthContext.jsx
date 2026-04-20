import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check if user is already logged in when app starts
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  // 2. Login Function
  const login = async (email, password) => {
    try {
      // Connect to YOUR Backend
      const config = { headers: { "Content-Type": "application/json" } };
      const { data } = await axios.post(
        "/api/auth/login",
        { email, password },
        config,
      );

      // Save to LocalStorage (so they stay logged in)
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      toast.success("Login Successful! Welcome back.");
      return true; // Success
    } catch (error) {
      // Handle Error
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return false; // Failed
    }
  };

  // 3. Register Function
  const register = async (name, email, password) => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const { data } = await axios.post(
        "/api/auth/register",
        { name, email, password },
        config,
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      toast.success("Account Created Successfully!");
      return true;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(message);
      return false;
    }
  };

  // 4. Logout Function
  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    toast.success("Logged out successfully");
  };
  // Helper to handle OTP Login response
  const handleOtpLogin = (userData) => {
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}!`);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loading, handleOtpLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
