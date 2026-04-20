/* eslint-disable no-unused-vars */
import React, { useContext, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTrendingDown,
} from "react-icons/fi";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const UrbanPlus = () => {
  const { user, handleOtpLogin } = useContext(AuthContext); // Re-use handleOtpLogin to update Context securely
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const hasActivePlus =
    user?.isPlusMember && new Date() < new Date(user?.plusMembershipExpiry);

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please login to buy Plus Membership");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      // 1. Create Order
      const { data: order } = await axios.post(
        "/api/payment/membership/create-order",
        {},
        config,
      );

      // 2. Open Razorpay
      const options = {
        key: "rzp_test_SMT0KbNTtnsRP8",
        amount: order.amount,
        currency: "INR",
        name: "UrbanPlus Membership",
        description: "6 Months Subscription",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment & Upgrade Account
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };

          const { data: verifyRes } = await axios.post(
            "/api/payment/membership/verify",
            verifyData,
            config,
          );

          if (verifyRes.success) {
            // Force Context & LocalStorage to update instantly
            localStorage.setItem("userInfo", JSON.stringify(verifyRes.user));
            handleOtpLogin(verifyRes.user);
            toast.success("Welcome to UrbanPlus! 🎉 Platform fees waived!");
            navigate("/cart"); // Take them to cart so they see the fee drop to 0!
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#d97706" }, // Gold Theme!
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Payment failed to initialize");
    }
    setLoading(false);
  };

  //  the above is for the production grade and now this we repalce with the url of the local host for testing purpose
  // const handlePurchase = async () => {
  //   if (!user) {
  //     toast.error("Please login to buy Plus Membership");
  //     navigate("/login");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const config = { headers: { Authorization: `Bearer ${user.token}` } };

  //     // 🌟 FIX 1: Change to localhost
  //     const { data: order } = await axios.post(
  //       "http://localhost:5000/api/payment/membership/create-order",
  //       {},
  //       config,
  //     );

  //     // 2. Open Razorpay
  //     const options = {
  //       key: "rzp_test_SMT0KbNTtnsRP8",
  //       amount: order.amount,
  //       currency: "INR",
  //       name: "UrbanPlus Membership",
  //       description: "6 Months Subscription",
  //       order_id: order.id,
  //       handler: async function (response) {
  //         // 3. Verify Payment & Upgrade Account
  //         const verifyData = {
  //           razorpay_order_id: response.razorpay_order_id,
  //           razorpay_payment_id: response.razorpay_payment_id,
  //           razorpay_signature: response.razorpay_signature,
  //         };

  //         // 🌟 FIX 2: Change to localhost
  //         const { data: verifyRes } = await axios.post(
  //           "http://localhost:5000/api/payment/membership/verify",
  //           verifyData,
  //           config,
  //         );

  //         if (verifyRes.success) {
  //           // Force Context & LocalStorage to update instantly
  //           localStorage.setItem("userInfo", JSON.stringify(verifyRes.user));
  //           handleOtpLogin(verifyRes.user);
  //           toast.success("Welcome to UrbanPlus! 🎉 Platform fees waived!");
  //           navigate("/cart"); // Take them to cart so they see the fee drop to 0!
  //         }
  //       },
  //       prefill: { name: user.name, email: user.email, contact: user.phone },
  //       theme: { color: "#d97706" }, // Gold Theme!
  //     };

  //     const rzp = new window.Razorpay(options);
  //     rzp.open();
  //   } catch (error) {
  //     toast.error("Payment failed to initialize");
  //   }
  //   setLoading(false);
  // };

  return (
    <div
      style={{
        backgroundColor: "#111827",
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "80px",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="border-0 rounded-4 overflow-hidden shadow-lg"
                style={{
                  background:
                    "linear-gradient(145deg, #fef3c7 0%, #f59e0b 100%)",
                }}
              >
                <Card.Body className="p-5 text-center">
                  <div className="bg-white p-3 rounded-circle d-inline-block mb-4 shadow-sm">
                    <FiStar size={40} className="text-warning" fill="#f59e0b" />
                  </div>
                  <h1
                    className="fw-bold text-dark mb-2"
                    style={{ letterSpacing: "-1px" }}
                  >
                    Urban<span className="text-white">Plus</span>
                  </h1>
                  <p className="text-dark fw-bold opacity-75 mb-4">
                    The ultimate savings membership.
                  </p>

                  {hasActivePlus ? (
                    <div className="bg-white p-4 rounded-4 shadow-sm">
                      <FiCheckCircle size={50} className="text-success mb-3" />
                      <h4 className="fw-bold text-dark">
                        You are a Plus Member!
                      </h4>
                      <p className="text-muted mb-0">
                        Valid until:{" "}
                        {new Date(
                          user.plusMembershipExpiry,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-4 text-start shadow-sm mb-4">
                        <div className="d-flex align-items-center mb-3">
                          <FiTrendingDown className="text-success fs-4 me-3" />
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">
                              Zero Platform Fees
                            </h6>
                            <small className="text-muted">
                              Save ₹29 on every single booking
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          <FiStar
                            className="text-warning fs-4 me-3"
                            fill="#f59e0b"
                          />
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">
                              Top-Rated Professionals
                            </h6>
                            <small className="text-muted">
                              Only 4.8+ rated partners assigned to you
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <FiShield className="text-primary fs-4 me-3" />
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">
                              100% Satisfaction Guarantee
                            </h6>
                            <small className="text-muted">
                              Priority customer support routing
                            </small>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="dark"
                        size="lg"
                        className="w-100 rounded-pill fw-bold py-3 shadow-lg"
                        onClick={handlePurchase}
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner size="sm" />
                        ) : (
                          "Get 6 Months for ₹299"
                        )}
                      </Button>
                      <small className="d-block mt-3 text-dark fw-bold opacity-75">
                        Pays for itself in just 10 bookings!
                      </small>
                    </>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UrbanPlus;
