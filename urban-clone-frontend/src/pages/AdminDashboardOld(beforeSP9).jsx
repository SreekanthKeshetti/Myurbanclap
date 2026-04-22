/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Table,
  Badge,
  Form,
  Row,
  Col,
  Card,
  Spinner,
  Button,
  Tabs,
  Tab,
  ListGroup,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUsers,
  FiActivity,
  FiShield,
  FiCreditCard,
  FiSmartphone,
  FiMessageSquare,
  FiSend,
  FiCheck,
} from "react-icons/fi";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/UI/ChatBox";
import io from "socket.io-client"; // For Admin Support Socket

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const socket = io.connect(import.meta.env.VITE_API_URL);

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [analytics, setAnalytics] = useState({
    revenueByDate: [],
    bookingsByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  // --- NEW: SUPPORT CRM STATE ---
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState("");
  const chatScrollRef = useRef(null);

  // --- CHAT STATE (Provider-Customer Intercept) ---
  const [showChat, setShowChat] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  // --- NEW: PAYOUTS STATE ---
  const [payouts, setPayouts] = useState([]);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const PIE_COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#3b82f6",
  ];
  // Fetch Payouts
  const fetchPayouts = async (silent = false) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/payouts/admin/all", config);
      setPayouts(data);
    } catch (error) {
      console.error("Failed to fetch payouts");
    }
  };

  // Process Payout
  const handleProcessPayout = async (id) => {
    if (
      !window.confirm(
        "Are you sure you have transferred the money to the provider's UPI?",
      )
    )
      return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/payouts/admin/${id}/process`, {}, config);
      toast.success("Payout marked as processed!");
      fetchPayouts();
    } catch (error) {
      toast.error("Failed to process payout");
    }
  };

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
    fetchSupportTickets();
    fetchPayouts(); // <-- ADD THIS

    const interval = setInterval(() => {
      fetchData(true);
      fetchSupportTickets(true);
      fetchPayouts(true); // <-- ADD THIS
    }, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  // --- 1. CORE DATA FETCHING ---
  const fetchData = async (silent = false) => {
    if (!user || !user.token) return;
    try {
      if (!silent) setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const [bookRes, userRes, analyticsRes] = await Promise.all([
        axios.get("/api/bookings/admin/all", config),
        axios.get("/api/auth/admin/users", config),
        axios.get("/api/bookings/admin/analytics", config),
      ]);

      setBookings(bookRes.data);
      setUsersList(userRes.data);
      setAnalytics(analyticsRes.data);

      if (!silent) setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // --- 2. SUPPORT TICKET LOGIC ---
  const fetchSupportTickets = async (silent = false) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/support/admin/tickets", config);
      setSupportTickets(data);
    } catch (error) {
      console.error("Support Fetch Error");
    }
  };

  const handleSelectTicket = async (ticket) => {
    setActiveTicket(ticket);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(
        `/api/support/${ticket._id}/messages`,
        config,
      );
      setSupportMessages(data);

      // Join Socket Room
      socket.emit("join_support_ticket", ticket._id);
    } catch (error) {
      toast.error("Failed to load chat");
    }
  };

  // Socket Listener for Admin Support Chat
  useEffect(() => {
    const supportMsgHandler = (newMsg) => {
      if (activeTicket && newMsg.ticketId === activeTicket._id) {
        setSupportMessages((prev) => [...prev, newMsg]);
      }
    };
    socket.on("receive_support_message", supportMsgHandler);
    return () => socket.off("receive_support_message", supportMsgHandler);
  }, [activeTicket]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportMessages]);

  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!supportInput.trim() || !activeTicket) return;

    const newMsg = {
      ticketId: activeTicket._id,
      senderId: user._id,
      text: supportInput,
      isAdmin: true, // Mark as Admin
    };

    socket.emit("send_support_message", newMsg);
    setSupportInput("");
  };

  const markTicketResolved = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `/api/support/admin/${activeTicket._id}/resolve`,
        {},
        config,
      );
      toast.success("Ticket Resolved");
      setActiveTicket(null);
      fetchSupportTickets(); // Refresh list
    } catch (error) {
      toast.error("Failed to resolve");
    }
  };

  // --- 3. EXISTING LOGIC (Status, Verification) ---
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (newStatus === "completed") {
        await axios.put(`/api/bookings/${id}/complete`, {}, config);
      } else {
        await axios.put(
          `/api/bookings/${id}/status`,
          { status: newStatus },
          config,
        );
      }
      toast.success(`Booking updated`);
      fetchData(true);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleProviderVerification = async (providerId, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        "/api/auth/admin/verify-provider",
        { providerId, action },
        config,
      );
      toast.success(`Provider ${action}ed`);
      fetchData(true);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleOpenChat = (booking) => {
    setChatBooking(booking);
    setShowChat(true);
  };

  // --- STATS ---
  const customers = usersList.filter((u) => u.role === "customer");
  const providers = usersList.filter((u) => u.role === "provider");
  const adminData = usersList.find((u) => u.role === "admin");

  const realizedRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce(
      (acc, item) => acc + (item.totalPrice || item.service?.price || 0),
      0,
    );
  const activeCount = bookings.filter((b) =>
    ["pending", "accepted", "ontheway", "arrived", "inprogress"].includes(
      b.status,
    ),
  ).length;

  if (loading)
    return (
      <div className="text-center mt-5 pt-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "50px",
      }}
    >
      <Container fluid style={{ maxWidth: "1400px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0">Admin God Mode</h2>
            <Badge bg="danger" className="mt-1">
              <FiShield className="me-1" /> System Administrator
            </Badge>
          </div>
        </div>

        <Tabs defaultActiveKey="support" className="mb-4 border-0 custom-tabs">
          {/* ================= TAB 1: LIVE SUPPORT CRM (NEW) ================= */}
          <Tab
            eventKey="support"
            title={
              <span>
                Live Support{" "}
                {supportTickets.length > 0 && (
                  <Badge bg="danger" className="ms-1">
                    {supportTickets.length}
                  </Badge>
                )}
              </span>
            }
          >
            <Row
              className="g-0 bg-white shadow-sm border rounded-4 overflow-hidden mt-3"
              style={{ height: "600px" }}
            >
              {/* LEFT PANE: TICKET LIST */}
              <Col
                md={4}
                className="border-end h-100 bg-light d-flex flex-column"
              >
                <div className="p-3 border-bottom bg-white">
                  <h6 className="fw-bold mb-0">Active Tickets</h6>
                </div>
                <div className="overflow-auto flex-grow-1 p-2">
                  {supportTickets.length === 0 ? (
                    <div className="text-center text-muted p-4 mt-5">
                      <FiCheckCircle
                        size={40}
                        className="mb-2 opacity-50 text-success"
                      />
                      <h6>Inbox Zero!</h6>
                      <small>No active customer complaints.</small>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {supportTickets.map((t) => (
                        <ListGroup.Item
                          key={t._id}
                          action
                          onClick={() => handleSelectTicket(t)}
                          className={`border-0 mb-2 rounded-3 ${activeTicket?._id === t._id ? "bg-primary text-white shadow-sm" : "bg-white shadow-sm"}`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold">
                              {t.user?.name || "Customer"}
                            </span>
                            <Badge
                              bg={
                                activeTicket?._id === t._id
                                  ? "light"
                                  : "warning"
                              }
                              text="dark"
                              style={{ fontSize: "9px" }}
                            >
                              {t.status.toUpperCase()}
                            </Badge>
                          </div>
                          <small
                            className={
                              activeTicket?._id === t._id
                                ? "text-white-50"
                                : "text-muted"
                            }
                            style={{ fontSize: "11px" }}
                          >
                            {t.user?.phone} • Last msg:{" "}
                            {new Date(t.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              </Col>

              {/* RIGHT PANE: CHAT WINDOW */}
              <Col md={8} className="h-100 d-flex flex-column bg-white">
                {activeTicket ? (
                  <>
                    {/* CHAT HEADER */}
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">
                          Chat with {activeTicket.user?.name}
                        </h6>
                        <small className="text-muted">
                          Ticket ID: #{activeTicket._id.slice(-8)}
                        </small>
                      </div>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="fw-bold rounded-pill px-3"
                        onClick={markTicketResolved}
                      >
                        <FiCheck className="me-1" /> Mark Resolved
                      </Button>
                    </div>

                    {/* CHAT MESSAGES */}
                    <div
                      className="flex-grow-1 p-4 overflow-auto"
                      style={{ backgroundColor: "#f8fafc" }}
                    >
                      {supportMessages.map((msg, idx) => {
                        const isAdmin = msg.isAdmin;
                        return (
                          <div
                            key={idx}
                            className={`d-flex mb-3 ${isAdmin ? "justify-content-end" : "justify-content-start"}`}
                          >
                            <div
                              className={`p-2 px-3 rounded-3 shadow-sm ${isAdmin ? "bg-dark text-white" : "bg-white border text-dark"}`}
                              style={{
                                maxWidth: "75%",
                                fontSize: "14px",
                                borderBottomRightRadius: isAdmin ? "0" : "",
                                borderBottomLeftRadius: !isAdmin ? "0" : "",
                              }}
                            >
                              {!isAdmin && (
                                <div
                                  className="fw-bold text-primary mb-1"
                                  style={{ fontSize: "10px" }}
                                >
                                  {activeTicket.user?.name}
                                </div>
                              )}
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatScrollRef} />
                    </div>

                    {/* CHAT INPUT */}
                    <div className="p-3 border-top bg-white">
                      <Form
                        onSubmit={handleSendSupportMessage}
                        className="d-flex gap-2"
                      >
                        <Form.Control
                          type="text"
                          placeholder="Type reply as UrbanClone Support..."
                          value={supportInput}
                          onChange={(e) => setSupportInput(e.target.value)}
                          className="rounded-pill bg-light border-0 px-3 py-2"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          className="rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{
                            width: "45px",
                            height: "45px",
                            minWidth: "45px",
                          }}
                          disabled={!supportInput.trim()}
                        >
                          <FiSend size={18} />
                        </Button>
                      </Form>
                    </div>
                  </>
                ) : (
                  <div className="h-100 d-flex align-items-center justify-content-center text-muted flex-column">
                    <FiMessageSquare size={60} className="mb-3 opacity-25" />
                    <h5>Select a ticket to view chat</h5>
                  </div>
                )}
              </Col>
            </Row>
          </Tab>

          {/* ================= TAB 2: ANALYTICS ================= */}
          <Tab eventKey="analytics" title="Analytics 📊">
            {/* ... Keep exactly the same Analytics code as your previous file ... */}
            <Row className="g-4 mb-4 mt-2">
              <Col lg={8}>
                <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
                  <h5 className="fw-bold mb-4">
                    Revenue Trends (Last 7 Active Days)
                  </h5>
                  <div style={{ height: "300px" }}>
                    {analytics.revenueByDate.length === 0 ? (
                      <p className="text-muted text-center mt-5 pt-4">
                        Not enough data to display chart.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenueByDate}>
                          <defs>
                            <linearGradient
                              id="colorRevenue"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#10b981"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#10b981"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            tickFormatter={(value) => `₹${value}`}
                            dx={-10}
                          />
                          <ChartTooltip
                            contentStyle={{
                              borderRadius: "10px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value) => [`₹${value}`, "Revenue"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
                  <h5 className="fw-bold mb-4">Bookings by Category</h5>
                  <div
                    style={{
                      height: "300px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {analytics.bookingsByCategory.length === 0 ? (
                      <p className="text-muted text-center mt-5 pt-4">
                        No bookings yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.bookingsByCategory}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.bookingsByCategory.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ),
                            )}
                          </Pie>
                          <ChartTooltip
                            contentStyle={{
                              borderRadius: "10px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Quick Stats */}
            <Row className="g-3">
              <Col md={3}>
                <Card className="border-0 shadow-sm p-3 rounded-4 h-100 bg-dark text-white">
                  <p className="small mb-0 opacity-75 fw-bold">
                    ADMIN WALLET (20% CUT)
                  </p>
                  <h3 className="fw-bold mb-0 text-success">
                    ₹{adminData?.walletBalance?.toFixed(2) || "0.00"}
                  </h3>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                  <p className="text-muted small mb-0 fw-bold">
                    PLATFORM GROSS VOLUME
                  </p>
                  <h4 className="fw-bold mb-0">
                    ₹{realizedRevenue.toLocaleString()}
                  </h4>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                  <p className="text-muted small mb-0 fw-bold">ACTIVE JOBS</p>
                  <h4 className="fw-bold mb-0">{activeCount}</h4>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm p-3 rounded-4 h-100">
                  <p className="text-muted small mb-0 fw-bold">
                    REGISTERED USERS
                  </p>
                  <h4 className="fw-bold mb-0">
                    {customers.length + providers.length}
                  </h4>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* ================= TAB 3: LIVE FEED ================= */}
          <Tab eventKey="overview" title="Live Feed">
            {/* ... Keep exactly the same Live Feed Table code ... */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Card.Header className="bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold">Live Bookings Feed</h5>
              </Card.Header>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 small text-muted">ID / CUSTOMER</th>
                    <th className="small text-muted">SERVICE (QTY)</th>
                    <th className="small text-muted">TIME SLOT</th>
                    <th className="small text-muted">TOTAL</th>
                    <th className="small text-muted">STATUS</th>
                    <th className="text-end pe-4 small text-muted">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="ps-4">
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "10px" }}
                        >
                          #{booking._id.slice(-6)}
                        </small>
                        <div className="fw-bold text-dark">
                          {booking.user?.name}
                        </div>
                        <div className="text-muted small">
                          {booking.user?.phone}
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-primary">
                          {booking.service?.name}
                        </div>
                        <Badge bg="light" text="dark" className="border">
                          Qty: {booking.quantity || 1}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center small text-dark fw-bold">
                          <FiClock className="me-1 text-muted" /> {booking.date}
                        </div>
                        <div className="text-primary small fw-bold">
                          @ {booking.timeSlot}
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">
                          ₹{booking.totalPrice || booking.service?.price}
                        </div>
                        <Badge
                          bg={
                            booking.paymentStatus === "paid"
                              ? "success"
                              : "warning"
                          }
                          style={{ fontSize: "9px" }}
                        >
                          {/* {booking.paymentMethod.toUpperCase()} -{" "}
                          {booking.paymentStatus.toUpperCase()} */}
                          {booking.paymentMethod?.toUpperCase() || "CASH"} -{" "}
                          {booking.paymentStatus?.toUpperCase() || "PENDING"}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            booking.status === "completed"
                              ? "success"
                              : "warning"
                          }
                          className="text-uppercase"
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <Button
                            variant="light"
                            size="sm"
                            className="border rounded-circle p-2 d-flex align-items-center justify-content-center"
                            onClick={() => handleOpenChat(booking)}
                            title="Chat with Customer"
                          >
                            <FiMessageSquare size={16} />
                          </Button>
                          <Form.Select
                            size="sm"
                            className="border-0 bg-light fw-bold shadow-sm d-inline-block w-auto"
                            value={booking.status}
                            onChange={(e) =>
                              handleStatusUpdate(booking._id, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </Form.Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Tab>

          {/* ================= TAB 4: PROVIDERS BEFORE RATING ================= */}
          {/* <Tab eventKey="providers" title={`Providers (${providers.length})`}>
           
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Partner Name</th>
                    <th>Category</th>
                    <th>Contact</th>
                    <th>Wallet Balance</th>
                    <th className="text-end pe-4">KYC / Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((prov) => (
                    <tr key={prov._id}>
                      <td className="ps-4 fw-bold">{prov.name}</td>
                      <td>
                        <Badge bg="dark">
                          {prov.providerDetails?.category}
                        </Badge>
                      </td>
                      <td className="text-muted small">{prov.phone}</td>
                      <td>
                        <span
                          className={`fw-bold ${prov.walletBalance < 0 ? "text-danger" : "text-success"}`}
                        >
                          ₹{prov.walletBalance?.toFixed(2) || "0.00"}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        {prov.providerDetails?.isVerified ? (
                          <Badge bg="success">
                            <FiCheckCircle className="me-1" /> Verified
                          </Badge>
                        ) : prov.providerDetails?.verificationStatus ===
                          "submitted" ? (
                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                handleProviderVerification(prov._id, "approve")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleProviderVerification(prov._id, "reject")
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Pending Upload
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Tab> */}
          {/* ================= TAB 4: PROVIDERS DIRECTORY ================= */}
          <Tab
            eventKey="providers"
            title={`Service Partners (${providers.length})`}
          >
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-muted small fw-bold">
                      PARTNER NAME
                    </th>
                    <th className="text-muted small fw-bold">CATEGORY</th>
                    <th className="text-muted small fw-bold">CONTACT</th>
                    <th className="text-muted small fw-bold">WALLET BALANCE</th>
                    {/* --- NEW: RATING COLUMN --- */}
                    <th className="text-muted small fw-bold">
                      RATING (LIFETIME)
                    </th>
                    {/* -------------------------- */}
                    <th className="text-end pe-4 text-muted small fw-bold">
                      KYC / VERIFICATION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((prov) => {
                    // Extract Rating Data safely
                    const rating = prov.providerDetails?.rating || 0;
                    const numReviews = prov.providerDetails?.numReviews || 0;

                    return (
                      <tr key={prov._id}>
                        <td className="ps-4 fw-bold text-dark">{prov.name}</td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {prov.providerDetails?.category || "Unassigned"}
                          </Badge>
                        </td>
                        <td className="text-muted small">{prov.phone}</td>
                        <td>
                          <span
                            className={`fw-bold ${prov.walletBalance < 0 ? "text-danger" : "text-success"}`}
                          >
                            ₹{prov.walletBalance?.toFixed(2) || "0.00"}
                          </span>
                        </td>

                        {/* --- NEW: VISUAL RATING INDICATOR --- */}
                        <td>
                          {numReviews === 0 ? (
                            <Badge bg="secondary" className="px-2">
                              New
                            </Badge>
                          ) : rating >= 4.5 ? (
                            <Badge bg="success" className="px-2">
                              ⭐ {rating.toFixed(1)} (Top Pro)
                            </Badge>
                          ) : rating >= 4.0 ? (
                            <Badge bg="primary" className="px-2">
                              ⭐ {rating.toFixed(1)}
                            </Badge>
                          ) : (
                            <Badge bg="danger" className="px-2 animate-pulse">
                              ⚠️ {rating.toFixed(1)} (Low)
                            </Badge>
                          )}
                          <br />
                          <small
                            className="text-muted"
                            style={{ fontSize: "9px" }}
                          >
                            {numReviews} reviews
                          </small>
                        </td>
                        {/* ------------------------------------ */}

                        <td className="text-end pe-4">
                          {prov.providerDetails?.isVerified ? (
                            <Badge bg="success" className="px-3 py-2">
                              <FiCheckCircle className="me-1" /> Verified
                            </Badge>
                          ) : prov.providerDetails?.verificationStatus ===
                            "submitted" ? (
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                className="fw-bold"
                                onClick={() =>
                                  handleProviderVerification(
                                    prov._id,
                                    "approve",
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="fw-bold"
                                onClick={() =>
                                  handleProviderVerification(prov._id, "reject")
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              bg="warning"
                              text="dark"
                              className="px-3 py-2"
                            >
                              Pending Upload
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          </Tab>

          {/* ================= TAB 5: CUSTOMERS ================= */}
          <Tab eventKey="customers" title={`Customers (${customers.length})`}>
            {/* ... Keep exactly the same Customers code ... */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Customer Name</th>
                    <th>Contact</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust._id}>
                      <td className="ps-4 d-flex align-items-center">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: "35px", height: "35px" }}
                        >
                          {cust.name[0].toUpperCase()}
                        </div>
                        <span className="fw-bold">{cust.name}</span>
                      </td>
                      <td className="text-muted">{cust.phone}</td>
                      <td className="text-muted small">
                        {new Date(cust.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Tab>
          {/* ================= TAB 6: FINANCIAL PAYOUTS ================= */}
          <Tab
            eventKey="payouts"
            title={
              <span>
                Payouts
                {payouts.filter((p) => p.status === "pending").length > 0 && (
                  <Badge bg="danger" className="ms-1">
                    {payouts.filter((p) => p.status === "pending").length}
                  </Badge>
                )}
              </span>
            }
          >
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-muted small fw-bold">PROVIDER</th>
                    <th className="text-muted small fw-bold">UPI ID</th>
                    <th className="text-muted small fw-bold">AMOUNT</th>
                    <th className="text-muted small fw-bold">DATE</th>
                    <th className="text-end pe-4 text-muted small fw-bold">
                      STATUS / ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No payout requests found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr
                        key={payout._id}
                        className={
                          payout.status === "processed"
                            ? "opacity-75 bg-light"
                            : ""
                        }
                      >
                        <td className="ps-4">
                          <div className="fw-bold text-dark">
                            {payout.provider?.name || "Unknown"}
                          </div>
                          <div className="text-muted small">
                            {payout.provider?.phone}
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg="dark"
                            className="fw-normal letter-spacing-1"
                          >
                            {payout.upiId}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-bold text-success fs-6">
                            ₹{payout.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {new Date(payout.createdAt).toLocaleDateString()}{" "}
                          <br />
                          {new Date(payout.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="text-end pe-4">
                          {payout.status === "processed" ? (
                            <Badge bg="success" className="px-3 py-2">
                              <FiCheckCircle className="me-1" /> Paid
                            </Badge>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              className="fw-bold px-3 py-2 shadow-sm btn-primary-custom"
                              onClick={() => handleProcessPayout(payout._id)}
                            >
                              Mark as Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </Tab>
        </Tabs>
      </Container>

      {/* KEEP EXISTING CHATBOX FOR PROVIDER INTERCEPT */}
      <ChatBox
        show={showChat}
        handleClose={() => setShowChat(false)}
        booking={chatBooking}
        currentUser={user}
      />
    </div>
  );
};

export default AdminDashboard;
