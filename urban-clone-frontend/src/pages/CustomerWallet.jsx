/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
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
import { FiArrowLeft, FiClock, FiShield, FiCreditCard } from "react-icons/fi";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CustomerWallet = () => {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchWallet = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get("/api/auth/my-wallet", config);
        setWalletData(data);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
      setLoading(false);
    };

    fetchWallet();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="text-center mt-5 pt-5" style={{ height: "100vh" }}>
        <Spinner animation="border" style={{ color: "var(--accent-color)" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: "100px",
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "80px",
      }}
    >
      <Container>
        <Button
          variant="link"
          className="mb-4 text-decoration-none text-dark p-0 fw-bold d-flex align-items-center"
          onClick={() => navigate("/profile")}
        >
          <FiArrowLeft className="me-2" /> Back to Profile
        </Button>

        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* WALLET BALANCE CARD */}
              <Card
                className="border-0 shadow-lg rounded-4 text-white overflow-hidden mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                }}
              >
                <Card.Body className="p-5 text-center position-relative">
                  {/* Faded Background Icon */}
                  <div
                    className="position-absolute"
                    style={{ top: "-20px", right: "-20px", opacity: 0.1 }}
                  >
                    <FiShield size={180} />
                  </div>

                  <div style={{ zIndex: 2, position: "relative" }}>
                    <h6
                      className="fw-bold mb-2 text-uppercase text-white-50 tracking-widest"
                      style={{ letterSpacing: "2px" }}
                    >
                      UrbanClone Wallet
                    </h6>
                    <h1 className="display-3 fw-bold mb-3">
                      ₹{walletData?.balance?.toFixed(2) || "0.00"}
                    </h1>
                    <p className="mb-0 text-white-50 small">
                      Available balance can be used automatically at Checkout.
                    </p>
                  </div>
                </Card.Body>
              </Card>

              {/* TRANSACTION PASSBOOK */}
              <h5 className="fw-bold mb-3 d-flex align-items-center text-dark mt-2">
                <FiClock className="me-2 text-primary" /> Wallet Passbook
              </h5>

              <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                {!walletData?.transactions ||
                walletData.transactions.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FiCreditCard size={50} className="mb-3 opacity-25" />
                    <h6 className="fw-bold text-dark">No Transactions Yet</h6>
                    <small>Refunds and credits will appear here.</small>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 align-middle">
                    <tbody>
                      {walletData.transactions.map((txn) => (
                        <tr key={txn._id}>
                          <td className="ps-4 py-3">
                            <div
                              className="fw-bold text-dark mb-1"
                              style={{ fontSize: "14px" }}
                            >
                              {txn.description}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <Badge
                                bg={
                                  txn.type === "credit"
                                    ? "success"
                                    : "secondary"
                                }
                                className={`${txn.type === "credit" ? "bg-opacity-10 text-success border-success" : "bg-opacity-10 text-dark border-secondary"} border`}
                                style={{ fontSize: "10px" }}
                              >
                                {txn.type.toUpperCase()}
                              </Badge>
                              <small
                                className="text-muted"
                                style={{ fontSize: "11px" }}
                              >
                                {new Date(txn.date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}{" "}
                                •{" "}
                                {new Date(txn.date).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </small>
                            </div>
                          </td>
                          <td
                            className={`text-end pe-4 fw-bold py-3 fs-5 ${txn.type === "credit" ? "text-success" : "text-dark"}`}
                          >
                            {txn.type === "credit" ? "+" : "-"}₹
                            {Math.abs(txn.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CustomerWallet;
