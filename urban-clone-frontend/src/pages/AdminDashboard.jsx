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
  Modal,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMessageSquare,
  FiSend,
  FiCheck,
  FiShield,
  FiTag,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/UI/ChatBox";
import io from "socket.io-client";
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

  // --- SUPPORT CRM STATE ---
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState("");
  const chatScrollRef = useRef(null);

  // --- CHAT STATE ---
  const [showChat, setShowChat] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);

  // --- 🌟 PAYOUTS STATE (From Step 1) ---
  const [payouts, setPayouts] = useState([]);

  // --- 🌟 PROMO CRM STATE (From Step 2) ---
  const [promos, setPromos] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderValue: "",
    expiryDate: "",
  });
  // --- 🌟 APP CONFIG STATE ---
  const [appConfig, setAppConfig] = useState({ isOperationsPaused: false });
  // --- 🌟 SERVICE CRM STATE (Phase 4) ---
  const [catalogTree, setCatalogTree] = useState([]);
  const [serviceUploading, setServiceUploading] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    subCategory: "",
    price: "",
    description: "",
    features: "",
    excludes: "",
    bookingType: "one-time",
    image: "",
  });

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

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
    fetchConfig();
    fetchSupportTickets();
    fetchPayouts();
    fetchPromos();

    const interval = setInterval(() => {
      fetchData(true);
      fetchSupportTickets(true);
      fetchPayouts(true);
    }, 60000); // 🌟 INCREASED to 60 seconds (60000 ms) instead of 10 seconds
    return () => clearInterval(interval);
  }, [user, navigate]);

  // --- FETCH CORE DATA ---
  const fetchData = async (silent = false) => {
    if (!user || !user.token) return;
    try {
      if (!silent) setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [bookRes, userRes, analyticsRes, treeRes] = await Promise.all([
        axios.get("/api/bookings/admin/all", config),
        axios.get("/api/auth/admin/users", config),
        axios.get("/api/bookings/admin/analytics", config),
        axios.get("/api/categories/tree"),
      ]);
      setBookings(bookRes.data);
      setUsersList(userRes.data);
      setAnalytics(analyticsRes.data);
      setCatalogTree(treeRes.data);
      if (!silent) setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // --- 🌟 FETCH PAYOUTS (Step 1) ---
  const fetchPayouts = async (silent = false) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/payouts/admin/all", config);
      setPayouts(data);
    } catch (error) {
      console.error("Failed to fetch payouts");
    }
  };

  const handleProcessPayout = async (id) => {
    if (!window.confirm("Are you sure you transferred the money via UPI?"))
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

  // --- 🌟 PROMO CRM FUNCTIONS (Step 2) ---
  const fetchPromos = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/promo/admin/all", config);
      setPromos(data);
    } catch (error) {
      console.error("Failed to fetch promos");
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post("/api/promo/admin/create", promoForm, config);
      toast.success("Promo Code Created!");
      setShowPromoModal(false);
      setPromoForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxDiscountAmount: "",
        minOrderValue: "",
        expiryDate: "",
      });
      fetchPromos();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create promo");
    }
  };

  const handleTogglePromo = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/promo/admin/${id}/toggle`, {}, config);
      toast.success("Promo status updated");
      fetchPromos();
    } catch (error) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Delete this promo code permanently?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/promo/admin/${id}`, config);
      toast.success("Promo deleted");
      fetchPromos();
    } catch (error) {
      toast.error("Failed to delete promo");
    }
  };
  // --- 🌟 SERVICE CRM FUNCTIONS ---
  const handleServiceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setServiceUploading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post("/api/upload", formData, config);
      setServiceForm({ ...serviceForm, image: data.imageUrl });
      toast.success("Image uploaded to Cloudinary!");
    } catch (error) {
      toast.error("Image upload failed");
    }
    setServiceUploading(false);
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!serviceForm.image) return toast.error("Please upload an image first!");

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const payload = {
        ...serviceForm,
        price: Number(serviceForm.price),
        features: serviceForm.features.split(",").map((f) => f.trim()),
        excludes: serviceForm.excludes.split(",").map((e) => e.trim()),
        searchTags: serviceForm.name.toLowerCase().split(" "),
      };

      await axios.post("/api/services", payload, config);
      toast.success("Service Created Successfully!");

      setServiceForm({
        name: "",
        category: "",
        subCategory: "",
        price: "",
        description: "",
        features: "",
        excludes: "",
        bookingType: "one-time",
        image: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create service");
    }
  };
  // APP CONFIG FETCH
  const fetchConfig = async () => {
    try {
      const { data } = await axios.get("/api/config");
      setAppConfig(data);
    } catch (error) {
      console.error("Failed to fetch config");
    }
  };

  // --- SUPPORT TICKET LOGIC ---
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
      socket.emit("join_support_ticket", ticket._id);
    } catch (error) {
      toast.error("Failed to load chat");
    }
  };

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
      isAdmin: true,
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
      fetchSupportTickets();
    } catch (error) {
      toast.error("Failed to resolve");
    }
  };

  // --- EXISTING ACTION HANDLERS ---
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
  // APP Config
  const handleToggleEmergency = async () => {
    const newStatus = !appConfig.isOperationsPaused;
    const confirmMsg = newStatus
      ? "🚨 WARNING: This will instantly PAUSE operations and block all customer checkouts. Proceed?"
      : "✅ Resume operations?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        "/api/config",
        { isOperationsPaused: newStatus },
        config,
      );
      setAppConfig(data);
      toast.success(newStatus ? "APP PAUSED" : "APP RESUMED");
    } catch (error) {
      toast.error("Failed to update config");
    }
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-0">Admin God Mode</h2>
            <Badge bg="danger" className="mt-1">
              <FiShield className="me-1" /> System Administrator
            </Badge>
          </div>

          {/* 🌟 EMERGENCY KILL SWITCH 🌟 */}
          <div
            className={`p-3 rounded-3 border d-flex align-items-center shadow-sm transition-all ${appConfig.isOperationsPaused ? "bg-danger bg-opacity-10 border-danger" : "bg-white"}`}
          >
            <Form.Check
              type="switch"
              id="emergency-switch"
              label={
                <span
                  className={`fw-bold ms-2 ${appConfig.isOperationsPaused ? "text-danger" : "text-dark"}`}
                >
                  EMERGENCY STOP (Lock App)
                </span>
              }
              checked={appConfig.isOperationsPaused}
              onChange={handleToggleEmergency}
              className="custom-switch-premium mb-0"
            />
          </div>
        </div>
        <Tabs defaultActiveKey="support" className="mb-4 border-0 custom-tabs">
          {/* TAB 1: SUPPORT CRM */}
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
              <Col md={8} className="h-100 d-flex flex-column bg-white">
                {activeTicket ? (
                  <>
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

          {/* TAB 2: ANALYTICS */}
          <Tab eventKey="analytics" title="Analytics 📊">
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

          {/* TAB 3: LIVE FEED */}
          <Tab eventKey="overview" title="Live Feed">
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
                            className="border rounded-circle p-2"
                            onClick={() => handleOpenChat(booking)}
                            title="Chat"
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

          {/* TAB 4: PROVIDERS */}
          <Tab eventKey="providers" title={`Partners (${providers.length})`}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-3">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-muted small fw-bold">
                      PARTNER NAME
                    </th>
                    <th className="text-muted small fw-bold">CATEGORY</th>
                    <th className="text-muted small fw-bold">CONTACT</th>
                    <th className="text-muted small fw-bold">WALLET</th>
                    <th className="text-muted small fw-bold">RATING</th>
                    <th className="text-end pe-4 text-muted small fw-bold">
                      KYC / VERIFICATION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((prov) => {
                    const rating = prov.providerDetails?.rating || 0;
                    const numReviews = prov.providerDetails?.numReviews || 0;
                    return (
                      <tr key={prov._id}>
                        <td className="ps-4 fw-bold text-dark">{prov.name}</td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {prov.providerDetails?.category?.name ||
                              "Unassigned"}
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
                        <td>
                          {numReviews === 0 ? (
                            <Badge bg="secondary">New</Badge>
                          ) : rating >= 4.5 ? (
                            <Badge bg="success">⭐ {rating.toFixed(1)}</Badge>
                          ) : (
                            <Badge bg="primary">⭐ {rating.toFixed(1)}</Badge>
                          )}
                          <br />
                          <small
                            className="text-muted"
                            style={{ fontSize: "9px" }}
                          >
                            {numReviews} reviews
                          </small>
                        </td>
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

          {/* TAB 5: CUSTOMERS */}
          <Tab eventKey="customers" title={`Customers (${customers.length})`}>
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

          {/* 🌟 TAB 6: PAYOUTS (Step 1) 🌟 */}
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

          {/* 🌟 TAB 7: MARKETING & PROMOS (Step 2) 🌟 */}
          <Tab eventKey="marketing" title="Marketing & Promos 🎯">
            <Card className="border-0 shadow-sm rounded-4 mt-3 bg-white p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Promo Code Engine</h5>
                  <p className="text-muted small mb-0">
                    Create and manage discount codes for customers.
                  </p>
                </div>
                <Button
                  variant="dark"
                  className="rounded-pill fw-bold btn-primary-custom d-flex align-items-center shadow-sm"
                  onClick={() => setShowPromoModal(true)}
                >
                  <FiPlus className="me-2" /> Create Promo
                </Button>
              </div>

              <Table
                responsive
                hover
                className="mb-0 align-middle border rounded-3 overflow-hidden"
              >
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-muted small fw-bold">CODE</th>
                    <th className="text-muted small fw-bold">DISCOUNT</th>
                    <th className="text-muted small fw-bold">MIN ORDER</th>
                    <th className="text-muted small fw-bold">STATUS</th>
                    <th className="text-muted small fw-bold">EXPIRES</th>
                    <th className="text-end pe-4 text-muted small fw-bold">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {promos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <FiTag size={40} className="mb-3 opacity-25" />
                        <h6>No Promo Codes Found</h6>
                        <small>Create your first code to boost sales!</small>
                      </td>
                    </tr>
                  ) : (
                    promos.map((promo) => {
                      const isExpired = new Date() > new Date(promo.expiryDate);
                      return (
                        <tr
                          key={promo._id}
                          className={
                            !promo.isActive || isExpired
                              ? "opacity-50 bg-light"
                              : ""
                          }
                        >
                          <td className="ps-4">
                            <Badge
                              bg="dark"
                              className="fs-6 letter-spacing-1 px-3 py-2"
                            >
                              {promo.code}
                            </Badge>
                          </td>
                          <td>
                            <span className="fw-bold text-success fs-6">
                              {promo.discountType === "percentage"
                                ? `${promo.discountValue}% OFF`
                                : `₹${promo.discountValue} FLAT`}
                            </span>
                            {promo.maxDiscountAmount && (
                              <small
                                className="d-block text-muted"
                                style={{ fontSize: "10px" }}
                              >
                                Up to ₹{promo.maxDiscountAmount}
                              </small>
                            )}
                          </td>
                          <td className="fw-bold text-muted small">
                            {promo.minOrderValue > 0
                              ? `₹${promo.minOrderValue}`
                              : "No Min"}
                          </td>
                          <td>
                            {isExpired ? (
                              <Badge bg="danger">Expired</Badge>
                            ) : (
                              <Form.Check
                                type="switch"
                                id={`switch-${promo._id}`}
                                checked={promo.isActive}
                                onChange={() => handleTogglePromo(promo._id)}
                                label={
                                  <span
                                    className={`small fw-bold ${promo.isActive ? "text-success" : "text-muted"}`}
                                  >
                                    {promo.isActive ? "Active" : "Paused"}
                                  </span>
                                }
                                className="custom-switch-premium"
                              />
                            )}
                          </td>
                          <td className="text-muted small">
                            {new Date(promo.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="text-end pe-4">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-circle p-2"
                              onClick={() => handleDeletePromo(promo._id)}
                              title="Delete Promo"
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </Card>
          </Tab>
          {/* 🌟 TAB 8: SERVICE CRM (Phase 4) 🌟 */}
          <Tab eventKey="service-crm" title="Service CRM 🛠️">
            <Card className="border-0 shadow-sm rounded-4 mt-3 bg-white p-4">
              <div className="mb-4 border-bottom pb-3">
                <h5 className="fw-bold mb-1">Service Catalog Manager</h5>
                <p className="text-muted small mb-0">
                  Add new services dynamically without requiring a database
                  seeder.
                </p>
              </div>

              <Form onSubmit={handleCreateService}>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        SERVICE NAME
                      </Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Premium Sofa Cleaning"
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        PRICE (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        required
                        value={serviceForm.price}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            price: e.target.value,
                          })
                        }
                        placeholder="999"
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        BOOKING TYPE
                      </Form.Label>
                      <Form.Select
                        value={serviceForm.bookingType}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            bookingType: e.target.value,
                          })
                        }
                        className="bg-light fw-bold"
                      >
                        <option value="one-time">One-Time Service</option>
                        <option value="subscription">
                          Monthly Subscription
                        </option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        PARENT CATEGORY
                      </Form.Label>
                      <Form.Select
                        required
                        value={serviceForm.category}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            category: e.target.value,
                            subCategory: "",
                          })
                        }
                        className="bg-light"
                      >
                        <option value="">Select Category...</option>
                        {catalogTree.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        SUB-CATEGORY
                      </Form.Label>
                      <Form.Select
                        required
                        value={serviceForm.subCategory}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            subCategory: e.target.value,
                          })
                        }
                        disabled={!serviceForm.category}
                        className="bg-light"
                      >
                        <option value="">Select Sub-Category...</option>
                        {catalogTree
                          .find((c) => c._id === serviceForm.category)
                          ?.subCategories?.map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">
                    DESCRIPTION
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    required
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value,
                      })
                    }
                    className="bg-light"
                    placeholder="Detailed explanation of the service..."
                  />
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        FEATURES (Comma separated)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={serviceForm.features}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            features: e.target.value,
                          })
                        }
                        placeholder="Deep clean, Chemical wash..."
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted">
                        EXCLUDES (Comma separated)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={serviceForm.excludes}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            excludes: e.target.value,
                          })
                        }
                        placeholder="Spare parts, Extra wiring..."
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4 p-3 border rounded-3 bg-light">
                  <Form.Label className="small fw-bold text-muted d-block">
                    SERVICE COVER IMAGE
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleServiceImageUpload}
                    disabled={serviceUploading}
                    className="mb-2"
                  />
                  {serviceUploading && (
                    <div className="text-primary small fw-bold mt-1">
                      <Spinner size="sm" className="me-2" /> Uploading to
                      Cloudinary...
                    </div>
                  )}
                  {serviceForm.image && (
                    <div className="text-success small fw-bold mt-1">
                      ✅ Image securely uploaded and linked!
                    </div>
                  )}
                </Form.Group>

                <Button
                  type="submit"
                  variant="dark"
                  className="w-100 py-3 rounded-pill fw-bold shadow-lg btn-primary-custom"
                  disabled={serviceUploading}
                >
                  Create Live Service
                </Button>
              </Form>
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

      {/* 🌟 NEW: PROMO CREATION MODAL 🌟 */}
      <Modal
        show={showPromoModal}
        onHide={() => setShowPromoModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center">
            <FiTag className="me-2 text-primary" /> Create Promo Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form onSubmit={handleCreatePromo}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                PROMO CODE
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. SUMMER50"
                className="bg-light fw-bold text-uppercase"
                value={promoForm.code}
                onChange={(e) =>
                  setPromoForm({
                    ...promoForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">
                    DISCOUNT TYPE
                  </Form.Label>
                  <Form.Select
                    className="bg-light fw-bold"
                    value={promoForm.discountType}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discountType: e.target.value,
                      })
                    }
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">
                    VALUE
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={
                      promoForm.discountType === "percentage"
                        ? "e.g. 20"
                        : "e.g. 100"
                    }
                    className="bg-light fw-bold"
                    value={promoForm.discountValue}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        discountValue: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-4">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label
                    className="small fw-bold text-muted"
                    style={{ fontSize: "10px" }}
                  >
                    MAX DISCOUNT (₹){" "}
                    <span className="fw-normal opacity-50">(Optional)</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 150"
                    className="bg-light"
                    value={promoForm.maxDiscountAmount}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        maxDiscountAmount: e.target.value,
                      })
                    }
                    disabled={promoForm.discountType === "flat"}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label
                    className="small fw-bold text-muted"
                    style={{ fontSize: "10px" }}
                  >
                    MIN ORDER VALUE (₹)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 499"
                    className="bg-light"
                    value={promoForm.minOrderValue}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        minOrderValue: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">
                EXPIRY DATE
              </Form.Label>
              <Form.Control
                type="date"
                className="bg-light fw-bold"
                value={promoForm.expiryDate}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, expiryDate: e.target.value })
                }
                required
              />
            </Form.Group>

            <Button
              type="submit"
              variant="dark"
              className="w-100 py-3 rounded-pill fw-bold shadow-sm btn-primary-custom"
            >
              Generate Promo Code
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
