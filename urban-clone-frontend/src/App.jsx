import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthContext, { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Navigation from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ServiceDetails from "./pages/ServiceDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import ProviderWallet from "./pages/ProviderWallet";
import SupportWidget from "./components/UI/SupportWidget";
import OrderSuccess from "./pages/OrderSuccess";
import CustomerWallet from "./pages/CustomerWallet"; // Add to imports
import UrbanPlus from "./pages/UrbanPlus"; // Add to imports
import Legal from "./pages/Legal";

function App() {
  return (
    <>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="d-flex flex-column min-vh-100 page-content">
              <Toaster position="top-center" reverseOrder={false} />
              <Navigation />
              <main className="flex-grow-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/provider" element={<ProviderDashboard />} />
                  <Route path="/services/:id" element={<ServiceDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/provider/wallet" element={<ProviderWallet />} />
                  <Route path="/customer/wallet" element={<CustomerWallet />} />
                  <Route path="/plus" element={<UrbanPlus />} />
                  <Route path="/terms" element={<Legal type="terms" />} />
                  <Route path="/privacy" element={<Legal type="privacy" />} />
                  <Route path="/refunds" element={<Legal type="refunds" />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <SupportWidget />
          </Router>
        </CartProvider>
      </AuthProvider>
      <style>
        {`
          .page-content {
            padding-top: 96px; /* safe space for navbar */
          }
          @media (max-width: 768px) {
            .page-content {
              padding-top: 88px;
            }
          }
        `}
      </style>
    </>
  );
}

export default App;
