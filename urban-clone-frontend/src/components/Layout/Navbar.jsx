// /* eslint-disable no-unused-vars */
// import React, { useState, useEffect, useContext } from "react";
// import {
//   Navbar,
//   Container,
//   Nav,
//   Button,
//   NavDropdown,
//   Badge,
// } from "react-bootstrap";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import {
//   FiUser,
//   FiMenu,
//   FiLogOut,
//   FiSettings,
//   FiShoppingCart,
//   FiBell,
//   FiCreditCard,
//   FiStar,
//   FiShield,
//   FiBriefcase,
// } from "react-icons/fi";
// import AuthContext from "../../context/AuthContext";
// import CartContext from "../../context/CartContext";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import io from "socket.io-client";

// const socket = io.connect(import.meta.env.VITE_API_URL);

// const Navigation = () => {
//   const { user, logout } = useContext(AuthContext);
//   const { cartItems } = useContext(CartContext);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [scrolled, setScrolled] = useState(false);

//   // --- NOTIFICATION STATES ---
//   const [notifications, setNotifications] = useState([]);
//   const unreadCount = notifications.filter((n) => !n.isRead).length;

//   // --- APP CONFIG (Emergency Pause) ---
//   const [appConfig, setAppConfig] = useState({
//     isOperationsPaused: false,
//     emergencyMessage: "",
//   });

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   // --- FETCH CONFIG & LISTEN FOR LOCKDOWN ---
//   useEffect(() => {
//     axios
//       .get("/api/config")
//       .then((res) => setAppConfig(res.data))
//       .catch((err) => console.log(err));

//     const configHandler = (data) => {
//       setAppConfig(data);
//     };
//     socket.on("app_config_update", configHandler);
//     return () => socket.off("app_config_update", configHandler);
//   }, []);

//   // --- FETCH AND LISTEN FOR NOTIFICATIONS ---
//   useEffect(() => {
//     if ("Notification" in window && Notification.permission === "default") {
//       Notification.requestPermission();
//     }
//     if (user) {
//       const fetchNotifs = async () => {
//         try {
//           const config = { headers: { Authorization: `Bearer ${user.token}` } };
//           const { data } = await axios.get("/api/notifications", config);
//           setNotifications(data);
//         } catch (error) {
//           console.error("Failed to fetch notifications");
//         }
//       };
//       fetchNotifs();

//       socket.emit("join_room", user._id);

//       const handleNewNotification = (newNotif) => {
//         const notifWithDate = {
//           ...newNotif,
//           createdAt: newNotif.createdAt || new Date().toISOString(),
//         };
//         setNotifications((prev) => [notifWithDate, ...prev]);

//         toast.success(newNotif.message, {
//           icon: "🔔",
//           style: {
//             border: "1px solid #713200",
//             padding: "16px",
//             color: "#713200",
//           },
//         });

//         if ("Notification" in window && Notification.permission === "granted") {
//           new window.Notification(newNotif.title || "UrbanClone Update", {
//             body: newNotif.message,
//             icon: "/1.png",
//             badge: "/1.png",
//             vibrate: [200, 100, 200],
//           });
//         }
//       };

//       socket.on("booking_update", handleNewNotification);

//       return () => {
//         socket.off("booking_update", handleNewNotification);
//       };
//     }
//   }, [user]);

//   const markAsRead = async (notifId) => {
//     try {
//       const config = { headers: { Authorization: `Bearer ${user.token}` } };
//       await axios.put(`/api/notifications/${notifId}/read`, {}, config);
//       setNotifications((prev) =>
//         prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)),
//       );
//       navigate("/bookings");
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <>
//       {/* 🌟 MILLION-DOLLAR NAVBAR STYLES 🌟 */}
//       <style>
//         {`
//         .modern-navbar {
//           background: rgba(255, 255, 255, 0.85) !important;
//           backdrop-filter: blur(16px);
//           -webkit-backdrop-filter: blur(16px);
//           border-bottom: 1px solid rgba(0,0,0,0.06);
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         .modern-navbar.scrolled {
//           box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08);
//           padding-top: 10px !important;
//           padding-bottom: 10px !important;
//           background: rgba(255, 255, 255, 0.95) !important;
//         }
//         .brand-text {
//           font-size: 26px;
//           font-weight: 800;
//           letter-spacing: -0.5px;
//           color: #0f172a;
//         }
//         .modern-nav-link {
//           color: #475569 !important;
//           font-weight: 600;
//           font-size: 0.95rem;
//           padding: 8px 16px !important;
//           border-radius: 8px;
//           margin: 0 4px;
//           transition: all 0.2s ease;
//           display: flex;
//           align-items: center;
//         }
//         .modern-nav-link:hover {
//           background: #f1f5f9;
//           color: #0f172a !important;
//         }
//         .modern-nav-link.active {
//           color: #0f172a !important;
//           background: #f1f5f9;
//         }

//         /* Unified Circular Icon Buttons for Cart/Bell */
//         .icon-btn {
//           width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.2s ease;
//           color: #475569;
//           cursor: pointer;
//           position: relative;
//           background: transparent;
//           border: none;
//         }
//         .icon-btn:hover {
//           background: #f1f5f9;
//           color: #0f172a;
//         }

//         /* Dropdown Polish */
//         .modern-dropdown .dropdown-toggle::after {
//           display: none; /* Hide default arrow */
//         }
//         .modern-dropdown .dropdown-menu {
//           border-radius: 16px;
//           padding: 12px;
//           border: 1px solid rgba(0,0,0,0.06);
//           box-shadow: 0 20px 40px rgba(0,0,0,0.12);
//           margin-top: 10px;
//         }
//         .modern-dropdown .dropdown-item {
//           border-radius: 10px;
//           padding: 10px 14px;
//           font-weight: 500;
//           color: #0f172a;
//           transition: 0.2s;
//         }
//         .modern-dropdown .dropdown-item:hover {
//           background-color: #f1f5f9;
//         }
//         .modern-dropdown .dropdown-item.text-danger:hover {
//           background-color: #fef2f2;
//           color: #dc2626 !important;
//         }
//         .notif-dropdown { width: 340px; max-height: 400px; overflow-y: auto; white-space: normal;}

//         /* Gold Plus Link */
//         .plus-link {
//           color: #d97706 !important;
//           background: #fffbeb;
//         }
//         .plus-link:hover {
//           background: #fef3c7 !important;
//           color: #b45309 !important;
//         }
//         `}
//       </style>

//       <Navbar
//         expand="lg"
//         fixed="top"
//         className={`modern-navbar py-3 ${scrolled ? "scrolled" : ""}`}
//       >
//         <Container>
//           <Navbar.Brand as={Link} to="/" className="brand-text">
//             Urban<span style={{ color: "var(--accent-color)" }}>Clone</span>
//           </Navbar.Brand>

//           <Navbar.Toggle className="border-0 shadow-none">
//             <FiMenu size={28} color="#0f172a" />
//           </Navbar.Toggle>

//           <Navbar.Collapse>
//             <Nav className="ms-auto align-items-center">
//               <Nav.Link
//                 as={Link}
//                 to="/"
//                 className={`modern-nav-link ${location.pathname === "/" ? "active" : ""}`}
//               >
//                 Home
//               </Nav.Link>
//               <Nav.Link
//                 as={Link}
//                 to="/services"
//                 className={`modern-nav-link ${location.pathname === "/services" ? "active" : ""}`}
//               >
//                 Services
//               </Nav.Link>

//               {/* THE GOLDEN PLUS LINK */}
//               <Nav.Link
//                 as={Link}
//                 to="/plus"
//                 className="modern-nav-link plus-link"
//               >
//                 <FiStar fill="#d97706" className="me-2" />
//                 {user?.isPlusMember ? "Plus Active" : "Get Plus"}
//               </Nav.Link>

//               {user?.role === "customer" && (
//                 <Nav.Link
//                   as={Link}
//                   to="/bookings"
//                   className={`modern-nav-link ${location.pathname === "/bookings" ? "active" : ""}`}
//                 >
//                   Bookings
//                 </Nav.Link>
//               )}

//               {user?.role === "admin" && (
//                 <Nav.Link as={Link} to="/admin" className="modern-nav-link">
//                   <Badge bg="danger" className="fw-bold px-2 py-1">
//                     <FiShield className="me-1" /> Admin Panel
//                   </Badge>
//                 </Nav.Link>
//               )}
//               {user?.role === "provider" && (
//                 <Nav.Link as={Link} to="/provider" className="modern-nav-link">
//                   <Badge bg="success" className="fw-bold px-2 py-1">
//                     <FiBriefcase className="me-1" /> Provider Portal
//                   </Badge>
//                 </Nav.Link>
//               )}

//               {/* DIVIDER FOR DESKTOP */}
//               <div
//                 className="d-none d-lg-block mx-2"
//                 style={{ width: "1px", height: "24px", background: "#e2e8f0" }}
//               ></div>

//               {/* THE BELL DROPDOWN */}
//               {user && (
//                 <NavDropdown
//                   align="end"
//                   className="modern-dropdown"
//                   title={
//                     <div className="icon-btn">
//                       <FiBell size={20} />
//                       {unreadCount > 0 && (
//                         <Badge
//                           bg="danger"
//                           pill
//                           className="position-absolute border border-white"
//                           style={{ top: "4px", right: "4px", fontSize: "9px" }}
//                         >
//                           {unreadCount}
//                         </Badge>
//                       )}
//                     </div>
//                   }
//                   id="notification-dropdown"
//                 >
//                   <div className="px-3 py-2 fw-bold border-bottom mb-2 text-muted small d-flex justify-content-between">
//                     <span>NOTIFICATIONS</span>
//                     {unreadCount > 0 && (
//                       <span className="text-primary">{unreadCount} New</span>
//                     )}
//                   </div>
//                   <div className="notif-dropdown px-2">
//                     {notifications.length === 0 ? (
//                       <div className="text-center text-muted p-4 small">
//                         <FiBell size={24} className="mb-2 opacity-25" />
//                         <p className="mb-0">No notifications yet</p>
//                       </div>
//                     ) : (
//                       notifications.map((notif) => (
//                         <NavDropdown.Item
//                           key={notif._id}
//                           onClick={() => markAsRead(notif._id)}
//                           className="d-flex flex-column mb-1"
//                           style={{
//                             backgroundColor: notif.isRead
//                               ? "transparent"
//                               : "#f0fdf4",
//                           }}
//                         >
//                           <div className="d-flex justify-content-between w-100 mb-1">
//                             <strong
//                               style={{ fontSize: "13px", color: "#0f172a" }}
//                             >
//                               {notif.title}
//                             </strong>
//                             {!notif.isRead && (
//                               <span
//                                 className="bg-success rounded-circle mt-1 flex-shrink-0"
//                                 style={{ width: "8px", height: "8px" }}
//                               ></span>
//                             )}
//                           </div>
//                           <span
//                             className="text-muted"
//                             style={{
//                               fontSize: "12px",
//                               whiteSpace: "normal",
//                               lineHeight: "1.4",
//                             }}
//                           >
//                             {notif.message}
//                           </span>
//                           <small
//                             className="text-muted mt-2 fw-bold"
//                             style={{ fontSize: "9px" }}
//                           >
//                             {notif.createdAt && (
//                               <>
//                                 {new Date(notif.createdAt).toLocaleDateString()}{" "}
//                                 at{" "}
//                                 {new Date(notif.createdAt).toLocaleTimeString(
//                                   [],
//                                   { hour: "2-digit", minute: "2-digit" },
//                                 )}
//                               </>
//                             )}
//                           </small>
//                         </NavDropdown.Item>
//                       ))
//                     )}
//                   </div>
//                 </NavDropdown>
//               )}

//               {/* CART ICON */}
//               <Link to="/cart" className="icon-btn text-decoration-none">
//                 <FiShoppingCart size={20} />
//                 {cartItems.length > 0 && (
//                   <Badge
//                     bg="danger"
//                     pill
//                     className="position-absolute border border-white"
//                     style={{ top: "4px", right: "0px", fontSize: "9px" }}
//                   >
//                     {cartItems.length}
//                   </Badge>
//                 )}
//               </Link>

//               {/* USER PROFILE DROPDOWN */}
//               {user ? (
//                 <NavDropdown
//                   align="end"
//                   className="modern-dropdown ms-lg-2 mt-3 mt-lg-0"
//                   title={
//                     <div
//                       className="d-flex align-items-center bg-light rounded-pill px-3 py-2 border shadow-sm transition-all"
//                       style={{ cursor: "pointer" }}
//                     >
//                       <div
//                         className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-2"
//                         style={{
//                           width: "24px",
//                           height: "24px",
//                           fontSize: "12px",
//                           fontWeight: "bold",
//                         }}
//                       >
//                         {user.name.charAt(0).toUpperCase()}
//                       </div>
//                       <span
//                         className="fw-bold text-dark"
//                         style={{ fontSize: "14px" }}
//                       >
//                         {user.name.split(" ")[0]}
//                       </span>
//                     </div>
//                   }
//                 >
//                   <NavDropdown.Item as={Link} to="/profile">
//                     <FiUser className="me-2 text-muted" /> My Profile
//                   </NavDropdown.Item>
//                   <NavDropdown.Item as={Link} to="/customer/wallet">
//                     <FiCreditCard className="me-2 text-muted" /> Wallet Passbook
//                   </NavDropdown.Item>
//                   <NavDropdown.Item as={Link} to="/profile">
//                     <FiSettings className="me-2 text-muted" /> Settings
//                   </NavDropdown.Item>
//                   <div className="border-top my-2"></div>
//                   <NavDropdown.Item
//                     onClick={handleLogout}
//                     className="text-danger fw-bold"
//                   >
//                     <FiLogOut className="me-2" /> Logout
//                   </NavDropdown.Item>
//                 </NavDropdown>
//               ) : (
//                 <Link to="/login" className="ms-lg-3 mt-3 mt-lg-0">
//                   <Button
//                     variant="dark"
//                     className="rounded-pill px-4 py-2 fw-bold shadow-sm"
//                   >
//                     Login / Sign Up
//                   </Button>
//                 </Link>
//               )}
//             </Nav>
//           </Navbar.Collapse>
//         </Container>
//       </Navbar>

//       {/* 🌟 THE GLOBAL EMERGENCY BANNER 🌟 */}
//       {appConfig.isOperationsPaused && (
//         <div
//           className="w-100 bg-danger text-white text-center py-2 px-3 shadow-lg fw-bold"
//           style={{
//             position: "fixed",
//             top: scrolled ? "70px" : "76px",
//             zIndex: 1020,
//             letterSpacing: "1px",
//             fontSize: "14px",
//             transition: "top 0.3s ease",
//           }}
//         >
//           🚨 {appConfig.emergencyMessage}
//         </div>
//       )}
//     </>
//   );
// };

// export default Navigation;
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
  FiShoppingCart,
  FiBell,
  FiCreditCard,
  FiStar,
  FiShield,
  FiBriefcase,
} from "react-icons/fi";
import AuthContext from "../../context/AuthContext";
import CartContext from "../../context/CartContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import io from "socket.io-client";

const socket = io.connect(import.meta.env.VITE_API_URL);

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  // 🌟 NEW: Control the mobile menu state programmatically
  const [expanded, setExpanded] = useState(false);

  // --- NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // --- APP CONFIG (Emergency Pause) ---
  const [appConfig, setAppConfig] = useState({
    isOperationsPaused: false,
    emergencyMessage: "",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- FETCH CONFIG & LISTEN FOR LOCKDOWN ---
  useEffect(() => {
    axios
      .get("/api/config")
      .then((res) => setAppConfig(res.data))
      .catch((err) => console.log(err));

    const configHandler = (data) => {
      setAppConfig(data);
    };
    socket.on("app_config_update", configHandler);
    return () => socket.off("app_config_update", configHandler);
  }, []);

  // --- FETCH AND LISTEN FOR NOTIFICATIONS ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (user) {
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

      socket.emit("join_room", user._id);

      const handleNewNotification = (newNotif) => {
        const notifWithDate = {
          ...newNotif,
          createdAt: newNotif.createdAt || new Date().toISOString(),
        };
        setNotifications((prev) => [notifWithDate, ...prev]);

        toast.success(newNotif.message, {
          icon: "🔔",
          style: {
            border: "1px solid #713200",
            padding: "16px",
            color: "#713200",
          },
        });

        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(newNotif.title || "UrbanClone Update", {
            body: newNotif.message,
            icon: "/1.png",
            badge: "/1.png",
            vibrate: [200, 100, 200],
          });
        }
      };

      socket.on("booking_update", handleNewNotification);

      return () => {
        socket.off("booking_update", handleNewNotification);
      };
    }
  }, [user]);

  const markAsRead = async (notifId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/notifications/${notifId}/read`, {}, config);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n)),
      );
      setExpanded(false); // Close menu
      navigate("/bookings");
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    setExpanded(false); // Close menu
    navigate("/login");
  };

  return (
    <>
      <style>
        {`
        .modern-navbar {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modern-navbar.scrolled {
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08);
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          background: rgba(255, 255, 255, 0.95) !important;
        }
        .brand-text {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .modern-nav-link {
          color: #475569 !important;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 8px 16px !important;
          border-radius: 8px;
          margin: 0 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
        .modern-nav-link:hover {
          background: #f1f5f9;
          color: #0f172a !important;
        }
        .modern-nav-link.active {
          color: #0f172a !important;
          background: #f1f5f9;
        }
        
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #475569;
          cursor: pointer;
          position: relative;
          background: transparent;
          border: none;
        }
        .icon-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        
        .modern-dropdown .dropdown-toggle::after {
          display: none; 
        }
        .modern-dropdown .dropdown-menu {
          border-radius: 16px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          margin-top: 10px;
        }
        .modern-dropdown .dropdown-item {
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 500;
          color: #0f172a;
          transition: 0.2s;
        }
        .modern-dropdown .dropdown-item:hover {
          background-color: #f1f5f9;
        }
        .modern-dropdown .dropdown-item.text-danger:hover {
          background-color: #fef2f2;
          color: #dc2626 !important;
        }
        .notif-dropdown { width: 340px; max-height: 400px; overflow-y: auto; white-space: normal;}
        
        .plus-link {
          color: #d97706 !important;
          background: #fffbeb;
        }
        .plus-link:hover {
          background: #fef3c7 !important;
          color: #b45309 !important;
        }
        `}
      </style>

      {/* 🌟 NEW: Added `expanded` and `onToggle` props */}
      <Navbar
        expand="lg"
        fixed="top"
        className={`modern-navbar py-3 ${scrolled ? "scrolled" : ""}`}
        expanded={expanded}
        onToggle={(isExpanded) => setExpanded(isExpanded)}
        style={{ zIndex: 1050 }}
      >
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="brand-text"
            onClick={() => setExpanded(false)}
          >
            Urban<span style={{ color: "var(--accent-color)" }}>Clone</span>
          </Navbar.Brand>

          <Navbar.Toggle className="border-0 shadow-none">
            <FiMenu size={28} color="#0f172a" />
          </Navbar.Toggle>

          <Navbar.Collapse>
            <Nav className="ms-auto align-items-center">
              {/* 🌟 NEW: Added onClick={() => setExpanded(false)} to EVERY Nav.Link */}
              <Nav.Link
                as={Link}
                to="/"
                className={`modern-nav-link ${location.pathname === "/" ? "active" : ""}`}
                onClick={() => setExpanded(false)}
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/services"
                className={`modern-nav-link ${location.pathname === "/services" ? "active" : ""}`}
                onClick={() => setExpanded(false)}
              >
                Services
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/plus"
                className="modern-nav-link plus-link"
                onClick={() => setExpanded(false)}
              >
                <FiStar fill="#d97706" className="me-2" />
                {user?.isPlusMember ? "Plus Active" : "Get Plus"}
              </Nav.Link>

              {user?.role === "customer" && (
                <Nav.Link
                  as={Link}
                  to="/bookings"
                  className={`modern-nav-link ${location.pathname === "/bookings" ? "active" : ""}`}
                  onClick={() => setExpanded(false)}
                >
                  Bookings
                </Nav.Link>
              )}

              {user?.role === "admin" && (
                <Nav.Link
                  as={Link}
                  to="/admin"
                  className="modern-nav-link"
                  onClick={() => setExpanded(false)}
                >
                  <Badge bg="danger" className="fw-bold px-2 py-1">
                    <FiShield className="me-1" /> Admin Panel
                  </Badge>
                </Nav.Link>
              )}
              {user?.role === "provider" && (
                <Nav.Link
                  as={Link}
                  to="/provider"
                  className="modern-nav-link"
                  onClick={() => setExpanded(false)}
                >
                  <Badge bg="success" className="fw-bold px-2 py-1">
                    <FiBriefcase className="me-1" /> Provider Portal
                  </Badge>
                </Nav.Link>
              )}

              <div
                className="d-none d-lg-block mx-2"
                style={{ width: "1px", height: "24px", background: "#e2e8f0" }}
              ></div>

              {user && (
                <NavDropdown
                  align="end"
                  className="modern-dropdown"
                  title={
                    <div className="icon-btn">
                      <FiBell size={20} />
                      {unreadCount > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          className="position-absolute border border-white"
                          style={{ top: "4px", right: "4px", fontSize: "9px" }}
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  }
                  id="notification-dropdown"
                >
                  <div className="px-3 py-2 fw-bold border-bottom mb-2 text-muted small d-flex justify-content-between">
                    <span>NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <span className="text-primary">{unreadCount} New</span>
                    )}
                  </div>
                  <div className="notif-dropdown px-2">
                    {notifications.length === 0 ? (
                      <div className="text-center text-muted p-4 small">
                        <FiBell size={24} className="mb-2 opacity-25" />
                        <p className="mb-0">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <NavDropdown.Item
                          key={notif._id}
                          onClick={() => markAsRead(notif._id)}
                          className="d-flex flex-column mb-1"
                          style={{
                            backgroundColor: notif.isRead
                              ? "transparent"
                              : "#f0fdf4",
                          }}
                        >
                          <div className="d-flex justify-content-between w-100 mb-1">
                            <strong
                              style={{ fontSize: "13px", color: "#0f172a" }}
                            >
                              {notif.title}
                            </strong>
                            {!notif.isRead && (
                              <span
                                className="bg-success rounded-circle mt-1 flex-shrink-0"
                                style={{ width: "8px", height: "8px" }}
                              ></span>
                            )}
                          </div>
                          <span
                            className="text-muted"
                            style={{
                              fontSize: "12px",
                              whiteSpace: "normal",
                              lineHeight: "1.4",
                            }}
                          >
                            {notif.message}
                          </span>
                          <small
                            className="text-muted mt-2 fw-bold"
                            style={{ fontSize: "9px" }}
                          >
                            {notif.createdAt && (
                              <>
                                {new Date(notif.createdAt).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(notif.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </>
                            )}
                          </small>
                        </NavDropdown.Item>
                      ))
                    )}
                  </div>
                </NavDropdown>
              )}

              <Link
                to="/cart"
                className="icon-btn text-decoration-none"
                onClick={() => setExpanded(false)}
              >
                <FiShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute border border-white"
                    style={{ top: "4px", right: "0px", fontSize: "9px" }}
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </Link>

              {user ? (
                <NavDropdown
                  align="end"
                  className="modern-dropdown ms-lg-2 mt-3 mt-lg-0"
                  title={
                    <div
                      className="d-flex align-items-center bg-light rounded-pill px-3 py-2 border shadow-sm transition-all"
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                        style={{
                          width: "24px",
                          height: "24px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="fw-bold text-dark"
                        style={{ fontSize: "14px" }}
                      >
                        {user.name.split(" ")[0]}
                      </span>
                    </div>
                  }
                >
                  {/* 🌟 NEW: Added onClick={() => setExpanded(false)} to Dropdown items */}
                  <NavDropdown.Item
                    as={Link}
                    to="/profile"
                    onClick={() => setExpanded(false)}
                  >
                    <FiUser className="me-2 text-muted" /> My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    as={Link}
                    to="/customer/wallet"
                    onClick={() => setExpanded(false)}
                  >
                    <FiCreditCard className="me-2 text-muted" /> Wallet Passbook
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    as={Link}
                    to="/profile"
                    onClick={() => setExpanded(false)}
                  >
                    <FiSettings className="me-2 text-muted" /> Settings
                  </NavDropdown.Item>
                  <div className="border-top my-2"></div>
                  <NavDropdown.Item
                    onClick={handleLogout}
                    className="text-danger fw-bold"
                  >
                    <FiLogOut className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Link
                  to="/login"
                  className="ms-lg-3 mt-3 mt-lg-0"
                  onClick={() => setExpanded(false)}
                >
                  <Button
                    variant="dark"
                    className="rounded-pill px-4 py-2 fw-bold shadow-sm"
                  >
                    Login / Sign Up
                  </Button>
                </Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {appConfig.isOperationsPaused && (
        <div
          className="w-100 bg-danger text-white text-center py-2 px-3 shadow-lg fw-bold"
          style={{
            position: "fixed",
            top: scrolled ? "70px" : "76px",
            zIndex: 1020,
            letterSpacing: "1px",
            fontSize: "14px",
            transition: "top 0.3s ease",
          }}
        >
          🚨 {appConfig.emergencyMessage}
        </div>
      )}
    </>
  );
};

export default Navigation;
