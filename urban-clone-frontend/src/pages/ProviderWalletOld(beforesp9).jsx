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
} from "react-bootstrap";
import {
  FiArrowLeft,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiBriefcase,
  FiCheckCircle,
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

const ProviderWallet = () => {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 🌟 NEW: ANALYTICS FILTER STATE ---
  const [timeFilter, setTimeFilter] = useState("7days"); // '7days', '30days', 'all'

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(
          "/api/bookings/provider/wallet",
          config,
        );
        setWalletData(data);
        setLoading(false);
      } catch (error) {
        console.error("Wallet Fetch Error:", error);
        setLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  // --- 🌟 NEW: DYNAMIC CHART DATA CALCULATION ---
  const chartData = useMemo(() => {
    if (!walletData?.transactions) return [];

    const now = new Date();
    // 1. We only want "credit" transactions for Earnings
    let earningsTxs = walletData.transactions.filter(
      (t) => t.type === "credit",
    );

    // 2. Determine how many days to look back
    let daysToSubtract = 7;
    if (timeFilter === "30days") daysToSubtract = 30;
    if (timeFilter === "all") daysToSubtract = 365 * 10; // basically all time

    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - daysToSubtract);

    // Filter by date
    earningsTxs = earningsTxs.filter((t) => new Date(t.date) >= cutoffDate);

    const grouped = {};

    // 3. Pre-fill the last X days with 0 so the chart looks complete (for 7 or 30 days)
    if (timeFilter !== "all") {
      for (let i = daysToSubtract - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        // Format: 'Mar 25'
        const dateStr = d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        grouped[dateStr] = 0;
      }
    }

    // 4. Map transactions to their dates
    earningsTxs.forEach((t) => {
      const dateStr = new Date(t.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      if (grouped[dateStr] !== undefined || timeFilter === "all") {
        grouped[dateStr] = (grouped[dateStr] || 0) + t.amount;
      }
    });

    // 5. Convert to array for Recharts
    return Object.keys(grouped).map((key) => ({
      date: key,
      earnings: grouped[key],
    }));
  }, [walletData, timeFilter]);

  // Calculate total earned in the selected period
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
              {/* Background Decoration */}
              <div
                className="position-absolute"
                style={{ top: "-20px", right: "-20px", opacity: 0.1 }}
              >
                <FiDollarSign size={150} />
              </div>

              <div style={{ zIndex: 2, position: "relative" }}>
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
                  ) : (
                    <Badge
                      bg="success"
                      className="p-2 fw-bold w-100 text-start d-flex align-items-center"
                      style={{ fontSize: "14px" }}
                    >
                      <FiCheckCircle className="me-2" size={16} />
                      Available for Weekly Payout
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

                {/* 🌟 THE REAL-WORLD FILTER CHIPS 🌟 */}
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
      </Container>
    </div>
  );
};

export default ProviderWallet;
