import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Container,
  Card,
  Table,
  Spinner,
  Badge,
  Button,
  Row,
  Col,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  FiArrowLeft,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiBriefcase,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "react-hot-toast";

const ProviderWallet = () => {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Analytics Filter State
  const [timeFilter, setTimeFilter] = useState("7days");

  // 🌟 NEW: Payout Modal States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  // 🌟 NEW: Payout Requests State
  const [payoutRequests, setPayoutRequests] = useState([]);

  // Extracted fetchWallet so we can call it after a successful payout request
  // const fetchWallet = async () => {
  //   try {
  //     const config = { headers: { Authorization: `Bearer ${user.token}` } };
  //     const { data } = await axios.get("/api/bookings/provider/wallet", config);
  //     setWalletData(data);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error("Wallet Fetch Error:", error);
  //     setLoading(false);
  //   }
  // };
  const fetchWallet = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      // 🌟 Fetch both Wallet Balance and Payout History simultaneously
      const [walletRes, payoutsRes] = await Promise.all([
        axios.get("/api/bookings/provider/wallet", config),
        axios.get("/api/payouts/my-payouts", config),
      ]);

      setWalletData(walletRes.data);
      setPayoutRequests(payoutsRes.data); // Save payouts to state
      setLoading(false);
    } catch (error) {
      console.error("Wallet Fetch Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWallet();
  }, [user]);

  // 🌟 Payout Submission Handler
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (payoutAmount < 500) return toast.error("Minimum payout is ₹500");
    if (payoutAmount > walletData.balance)
      return toast.error("Insufficient balance");
    if (!upiId.includes("@"))
      return toast.error("Enter a valid UPI ID (e.g. 9876543210@ybl)");

    setPayoutLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(
        "/api/payouts/request",
        { amount: Number(payoutAmount), upiId },
        config,
      );

      toast.success("Payout requested! The admin will process it shortly.");
      setShowPayoutModal(false);
      setPayoutAmount("");
      setUpiId("");

      // Instantly refresh wallet UI
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payout request failed");
    } finally {
      setPayoutLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!walletData?.transactions) return [];

    const now = new Date();
    let earningsTxs = walletData.transactions.filter(
      (t) => t.type === "credit",
    );

    let daysToSubtract = 7;
    if (timeFilter === "30days") daysToSubtract = 30;
    if (timeFilter === "all") daysToSubtract = 365 * 10;

    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - daysToSubtract);

    earningsTxs = earningsTxs.filter((t) => new Date(t.date) >= cutoffDate);
    const grouped = {};

    if (timeFilter !== "all") {
      for (let i = daysToSubtract - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        grouped[dateStr] = 0;
      }
    }

    earningsTxs.forEach((t) => {
      const dateStr = new Date(t.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      if (grouped[dateStr] !== undefined || timeFilter === "all") {
        grouped[dateStr] = (grouped[dateStr] || 0) + t.amount;
      }
    });

    return Object.keys(grouped).map((key) => ({
      date: key,
      earnings: grouped[key],
    }));
  }, [walletData, timeFilter]);

  const periodTotal = chartData.reduce((sum, item) => sum + item.earnings, 0);

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  return (
    <div
      style={{
        paddingTop: "100px",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "50px",
      }}
    >
      <Container>
        <Button
          variant="link"
          className="mb-3 text-decoration-none text-muted p-0 fw-bold d-flex align-items-center"
          onClick={() => navigate("/provider")}
        >
          <FiArrowLeft className="me-2" /> Back to Dashboard
        </Button>

        <h2 className="fw-bold mb-4">Financials & Earnings</h2>

        <Row className="g-4 mb-4">
          {/* LEFT: MASTER WALLET CARD */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-4 bg-dark text-white h-100 p-4 position-relative overflow-hidden">
              <div
                className="position-absolute"
                style={{ top: "-20px", right: "-20px", opacity: 0.1 }}
              >
                <FiDollarSign size={150} />
              </div>

              <div
                style={{ zIndex: 2, position: "relative" }}
                className="d-flex flex-column h-100"
              >
                <p className="mb-1 opacity-75 fw-bold small text-uppercase">
                  Net Wallet Balance
                </p>
                <h1 className="fw-bold display-4 mb-4">
                  ₹
                  {walletData?.balance ? walletData.balance.toFixed(2) : "0.00"}
                </h1>

                <div className="mt-auto">
                  {walletData?.balance < 0 ? (
                    <Badge
                      bg="danger"
                      className="p-2 fw-bold w-100 text-start d-flex align-items-center"
                    >
                      <FiAlertTriangle className="me-2" size={16} />
                      You owe commission to Admin
                    </Badge>
                  ) : walletData?.balance >= 500 ? (
                    <Button
                      variant="success"
                      className="w-100 text-start d-flex align-items-center fw-bold border-0 shadow-sm py-2"
                      onClick={() => setShowPayoutModal(true)}
                    >
                      <FiCheckCircle className="me-2" size={18} />
                      Request Payout Now
                    </Button>
                  ) : (
                    <Badge
                      bg="warning"
                      text="dark"
                      className="p-2 fw-bold w-100 text-start d-flex align-items-center"
                    >
                      <FiAlertTriangle className="me-2" size={16} />
                      Min ₹500 required to withdraw
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </Col>

          {/* RIGHT: EARNINGS ANALYTICS CHART */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                  <h5 className="fw-bold mb-1 d-flex align-items-center">
                    <FiTrendingUp className="text-success me-2" /> Earnings
                    Overview
                  </h5>
                  <h3 className="fw-bold text-success mb-0">
                    ₹{periodTotal.toFixed(2)}{" "}
                    <span className="text-muted fs-6">earned</span>
                  </h3>
                </div>

                <div className="d-flex gap-2 bg-light p-1 rounded-pill border">
                  <Button
                    variant={timeFilter === "7days" ? "dark" : "transparent"}
                    className={`rounded-pill btn-sm fw-bold px-3 ${timeFilter !== "7days" ? "text-muted" : ""}`}
                    onClick={() => setTimeFilter("7days")}
                  >
                    7 Days
                  </Button>
                  <Button
                    variant={timeFilter === "30days" ? "dark" : "transparent"}
                    className={`rounded-pill btn-sm fw-bold px-3 ${timeFilter !== "30days" ? "text-muted" : ""}`}
                    onClick={() => setTimeFilter("30days")}
                  >
                    30 Days
                  </Button>
                  <Button
                    variant={timeFilter === "all" ? "dark" : "transparent"}
                    className={`rounded-pill btn-sm fw-bold px-3 ${timeFilter !== "all" ? "text-muted" : ""}`}
                    onClick={() => setTimeFilter("all")}
                  >
                    All Time
                  </Button>
                </div>
              </div>

              <div style={{ height: "220px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <ChartTooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [`₹${value}`, "Earnings"]}
                    />
                    <Bar
                      dataKey="earnings"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.earnings > 0 ? "#10b981" : "#cbd5e1"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        {/* TRANSACTION HISTORY (Digital Passbook) */}
        <h5 className="fw-bold mb-3 d-flex align-items-center mt-2">
          <FiBriefcase className="me-2 text-primary" /> Passbook History
        </h5>
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 text-muted small fw-bold py-3">
                  DESCRIPTION
                </th>
                <th className="text-muted small fw-bold py-3">DATE & TIME</th>
                <th className="text-end pe-4 text-muted small fw-bold py-3">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {!walletData?.transactions ||
              walletData.transactions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    <div className="opacity-50 mb-2">
                      <FiClock size={40} />
                    </div>
                    <p className="mb-0 fw-bold">No transactions yet</p>
                    <small>Complete a job to see your earnings here.</small>
                  </td>
                </tr>
              ) : (
                walletData.transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td className="ps-4 py-3">
                      <div
                        className="fw-bold text-dark"
                        style={{ fontSize: "14px" }}
                      >
                        {txn.description}
                      </div>
                      <Badge
                        bg={txn.type === "credit" ? "success" : "danger"}
                        className="bg-opacity-10 text-dark border-0 mt-1 px-2"
                        style={{ fontSize: "10px" }}
                      >
                        {txn.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-muted small py-3">
                      <div className="d-flex align-items-center">
                        <FiClock className="me-1 opacity-75" />
                        {new Date(txn.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="mx-1">•</span>
                        {new Date(txn.date).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td
                      className={`text-end pe-4 fw-bold py-3 fs-5 ${txn.type === "credit" ? "text-success" : "text-danger"}`}
                    >
                      {txn.type === "credit" ? "+" : "-"}₹
                      {Math.abs(txn.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
        {/* 🌟 NEW: WITHDRAWAL TRACKER 🌟 */}
        <h5 className="fw-bold mb-3 d-flex align-items-center mt-5">
          <FiTrendingUp className="me-2 text-success" /> Withdrawal Tracker
        </h5>
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 text-muted small fw-bold py-3">UPI ID</th>
                <th className="text-muted small fw-bold py-3">REQUEST DATE</th>
                <th className="text-muted small fw-bold py-3">AMOUNT</th>
                <th className="text-end pe-4 text-muted small fw-bold py-3">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {payoutRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    <p className="mb-0 fw-bold">No withdrawal requests yet.</p>
                  </td>
                </tr>
              ) : (
                payoutRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="ps-4 py-3 fw-bold text-dark">
                      {request.upiId}
                    </td>
                    <td className="text-muted small py-3">
                      {new Date(request.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="fw-bold fs-6 text-dark py-3">
                      ₹{request.amount.toFixed(2)}
                    </td>
                    <td className="text-end pe-4 py-3">
                      {request.status === "processed" ? (
                        <Badge
                          bg="success"
                          className="px-3 py-2 border border-success bg-opacity-10 text-success"
                        >
                          <FiCheckCircle className="me-1" /> Processed
                        </Badge>
                      ) : (
                        <Badge
                          bg="warning"
                          text="dark"
                          className="px-3 py-2 border border-warning bg-opacity-10 text-dark"
                        >
                          <FiClock className="me-1" /> Pending
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </Container>

      {/* 🌟 NEW: PAYOUT MODAL 🌟 */}
      <Modal
        show={showPayoutModal}
        onHide={() => setShowPayoutModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center">
            <FiDollarSign className="me-2 text-success" /> Request Payout
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="bg-light p-3 rounded-3 mb-4 border d-flex justify-content-between align-items-center">
            <span className="text-muted fw-bold small">AVAILABLE BALANCE</span>
            <span className="fw-bold text-success fs-5">
              ₹{walletData?.balance.toFixed(2)}
            </span>
          </div>

          <Form onSubmit={handleRequestPayout}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">
                ENTER AMOUNT (Min ₹500)
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0 fw-bold">
                  ₹
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="0.00"
                  className="bg-light border-start-0 fw-bold fs-5"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={walletData?.balance}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">
                UPI ID / VPA
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. yourname@ybl"
                className="bg-light py-3"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                required
              />
              <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
                Payments are processed manually by Admin within 24 hours.
              </Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="dark"
              className="w-100 py-3 rounded-pill fw-bold shadow-sm"
              disabled={payoutLoading}
            >
              {payoutLoading ? <Spinner size="sm" /> : "Confirm Payout Request"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProviderWallet;
