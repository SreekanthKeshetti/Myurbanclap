/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import {
  Navbar,
  Container,
  Nav,
  Button,
  NavDropdown,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiUser,
  FiMenu,
  FiLogOut,
  FiSettings,
  FiGrid,
  FiBriefcase,
  FiShoppingCart,
  FiBell,
  FiCreditCard,
  FiStar,
} from "react-icons/fi";
import AuthContext from "../../context/AuthContext";
import CartContext from "../../context/CartContext";
import axios from "axios";
import { toast } from "react-hot-toast"; // <--- Imported toast here!
import io from "socket.io-client";

// Initialize socket outside component to prevent reconnects
const socket = io.connect(import.meta.env.VITE_API_URL);

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  // NOTIFICATION STATES
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // FETCH AND LISTEN FOR NOTIFICATIONS
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (user) {
      // 1. Fetch History from DB
      const fetchNotifs = async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data } = await axios.get("/api/notifications", config);
          setNotifications(data);
        } catch (error) {
          console.error("Failed to fetch notifications");
        }
      };
      fetchNotifs();

      // 2. Listen for Real-Time Updates
      socket.emit("join_room", user._id);

      const handleNewNotification = (newNotif) => {
        // 🌟 FIX: Add a date right when the event happens (Pure React approach)
        const notifWithDate = {
          ...newNotif,
          createdAt: newNotif.createdAt || new Date().toISOString(),
        };
        // Add the new notification to the top of the list
        setNotifications((prev) => [newNotif, ...prev]);

        // Show the real-time popup (The Ephemeral UI!)
        toast.success(newNotif.message, {
          icon: "🔔",
          style: {
            border: "1px solid #713200",
            padding: "16px",
            color: "#713200",
          },
        });
        // 🌟 NEW: NATIVE SYSTEM PUSH NOTIFICATION 🌟
        // This fires a lock-screen/desktop notification if the app is minimized!
        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(newNotif.title || "UrbanClone Update", {
            body: newNotif.message,
            icon: "/1.png", // Your PWA icon
            badge: "/1.png",
            vibrate: [200, 100, 200], // Vibrates on Android
          });
        }
      };

      socket.on("booking_update", handleNewNotification);

      return () => {
        socket.off("booking_update", handleNewNotification);
      };
    }
  }, [user]);

  // MARK AS READ
  const markAsRead = async (notifId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/notifications/${notifId}/read`, {}, config);

      // Update local state so the red dot disappears instantly
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)),
      );

      // Navigate to bookings page when clicked
      navigate("/bookings");
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navbarStyle = {
    background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
    transition: "all 0.35s ease",
    padding: scrolled ? "12px 0" : "22px 0",
    boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.08)" : "none",
  };

  const linkStyle = {
    color: "#0f172a",
    fontWeight: 600,
    marginRight: "20px",
    fontSize: "0.95rem",
  };

  return (
    <>
      <style>
        {`
        .nav-link:not(.dropdown-toggle) { position: relative; padding-bottom: 8px; color: #0f172a !important; }
        .nav-link:not(.dropdown-toggle)::after {
          content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 1.5px;
          background-color: var(--accent-color); transform: scaleX(0); transform-origin: left;
          opacity: 0; transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
        }
        .nav-link:not(.dropdown-toggle):hover::after { transform: scaleX(1); opacity: 1; }
        .nav-link.active::after { display: none; }
        .dropdown-toggle { color: #0f172a !important; font-weight: 600; }
        .dropdown-toggle::after { color: #0f172a !important; margin-left: 6px; opacity: 1 !important; }
        .dropdown-menu { border-radius: 14px; padding: 8px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
        .dropdown-item { border-radius: 10px; padding: 10px 14px; font-weight: 500; color: #0f172a; }
        .dropdown-item:hover { background-color: rgba(15,23,42,0.06); }
        .dropdown-item.text-danger:hover { background-color: rgba(185,28,28,0.08); color: #7f1d1d; }
        
        /* Custom Notification Scrollbar */
        .notif-dropdown { width: 320px; max-height: 400px; overflow-y: auto; white-space: normal;}
        `}
      </style>

      <Navbar expand="lg" fixed="top" style={navbarStyle}>
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}
          >
            Urban<span style={{ color: "var(--accent-color)" }}>Clone</span>
          </Navbar.Brand>

          <Navbar.Toggle>
            <FiMenu size={24} color="#0f172a" />
          </Navbar.Toggle>

          <Navbar.Collapse>
            <Nav className="ms-auto align-items-center">
              <Nav.Link
                as={Link}
                to="/"
                style={linkStyle}
                className={location.pathname === "/" ? "active" : ""}
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/services"
                style={linkStyle}
                className={location.pathname === "/services" ? "active" : ""}
              >
                Services
              </Nav.Link>
              {/* THE GOLDEN PLUS LINK */}
              <Nav.Link
                as={Link}
                to="/plus"
                style={{
                  ...linkStyle,
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FiStar fill="#d97706" className="me-1" />
                {user?.isPlusMember ? "Plus Active" : "Get Plus"}
              </Nav.Link>

              {user?.role === "customer" && (
                <Nav.Link
                  as={Link}
                  to="/bookings"
                  style={linkStyle}
                  className={location.pathname === "/bookings" ? "active" : ""}
                >
                  Bookings
                </Nav.Link>
              )}
              {user?.role === "admin" && (
                <Nav.Link as={Link} to="/admin" style={linkStyle}>
                  <Badge bg="danger" className="fw-normal">
                    Admin Panel
                  </Badge>
                </Nav.Link>
              )}
              {user?.role === "provider" && (
                <Nav.Link as={Link} to="/provider" style={linkStyle}>
                  <Badge bg="success" className="fw-normal">
                    Provider Dashboard
                  </Badge>
                </Nav.Link>
              )}

              {/* THE BELL DROPDOWN */}
              {user && (
                <NavDropdown
                  align="end"
                  title={
                    <div className="position-relative d-inline-block pt-1 pe-1">
                      <FiBell size={22} />
                      {unreadCount > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          className="position-absolute top-0 start-100 translate-middle border border-white"
                          style={{ fontSize: "9px" }}
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  }
                  id="notification-dropdown"
                >
                  <div className="p-2 fw-bold border-bottom mb-2 text-muted small">
                    NOTIFICATIONS
                  </div>
                  <div className="notif-dropdown">
                    {notifications.length === 0 ? (
                      <div className="text-center text-muted p-3 small">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <NavDropdown.Item
                          key={notif._id}
                          onClick={() => markAsRead(notif._id)}
                          className="d-flex flex-column py-2"
                          style={{
                            backgroundColor: notif.isRead
                              ? "transparent"
                              : "#f0fdf4",
                          }}
                        >
                          <div className="d-flex justify-content-between w-100">
                            <strong style={{ fontSize: "13px" }}>
                              {notif.title}
                            </strong>
                            {!notif.isRead && (
                              <span
                                className="bg-success rounded-circle"
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  margin: "4px 0 0 4px",
                                }}
                              ></span>
                            )}
                          </div>
                          <span
                            className="text-muted"
                            style={{ fontSize: "12px", whiteSpace: "normal" }}
                          >
                            {notif.message}
                          </span>
                          {/* <small
                            className="text-muted mt-1"
                            style={{ fontSize: "10px" }}
                          >
                            {new Date(notif.createdAt).toLocaleDateString()}{" "}
                            {new Date(notif.createdAt).toLocaleTimeString()}
                          </small> */}
                          <small
                            className="text-muted mt-1"
                            style={{ fontSize: "10px" }}
                          >
                            {notif.createdAt && (
                              <>
                                {new Date(notif.createdAt).toLocaleDateString()}{" "}
                                {new Date(notif.createdAt).toLocaleTimeString()}
                              </>
                            )}
                          </small>
                        </NavDropdown.Item>
                      ))
                    )}
                  </div>
                </NavDropdown>
              )}

              <Nav.Link
                as={Link}
                to="/cart"
                style={{
                  ...linkStyle,
                  marginRight: "15px",
                  display: "flex",
                  alignItems: "center",
                }}
                className="position-relative"
              >
                <FiShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "10px", padding: "4px 6px" }}
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </Nav.Link>

              {user ? (
                <NavDropdown
                  align="end"
                  title={
                    <>
                      <FiUser className="me-1 mb-1" />
                      {user.name.split(" ")[0]}
                    </>
                  }
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <FiSettings className="me-2" />
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    onClick={handleLogout}
                    className="text-danger"
                  >
                    <FiLogOut className="me-2" />
                    Logout
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/customer/wallet">
                    <FiCreditCard className="me-2" />
                    My Wallet
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Link to="/login">
                  <Button className="ms-3 rounded-pill px-4 fw-bold">
                    Login / Sign Up
                  </Button>
                </Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Navigation;
