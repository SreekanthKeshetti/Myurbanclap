/* eslint-disable no-unused-vars */
import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Card,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiArrowRight, FiLock } from "react-icons/fi";

const Login = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  // NEW: Category for Partners
  const [category, setCategory] = useState("Plumbing");

  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, handleOtpLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "provider") navigate("/provider");
      else navigate("/");
    }
  }, [user, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return toast.error("Enter valid phone number");

    setLoading(true);
    try {
      await axios.post("/api/auth/send-otp", {
        phone,
      });
      toast.success("OTP Sent: 1234");
      setStep(2);
    } catch (error) {
      toast.error("Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We send category along with OTP.
      // The Backend will decide: "If new user, save category. If existing user, ignore category."
      const payload = {
        phone,
        otp,
        name: name || undefined,
        role: isProvider ? "provider" : "customer",
        // category: isProvider ? category : undefined, // Send category only for providers
      };

      const { data } = await axios.post("/api/auth/verify-otp", payload);

      if (handleOtpLogin) {
        handleOtpLogin(data);
      }
    } catch (error) {
      if (error.response?.data?.message?.includes("Name")) {
        toast("Please enter your name to register", { icon: "👋" });
      } else {
        toast.error("Invalid OTP or Login Failed");
      }
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "120px",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                <div
                  className={`p-4 text-center ${isProvider ? "bg-dark" : "bg-primary"}`}
                >
                  <h4 className="fw-bold text-white mb-0">
                    {isProvider ? "Partner Login" : "Login / Sign Up"}
                  </h4>
                  <p className="text-white-50 small mb-0">
                    {isProvider
                      ? "Join us and grow your business"
                      : "Get started with Urban Clone"}
                  </p>
                </div>

                <Card.Body className="p-5">
                  {step === 1 && (
                    <Form onSubmit={handleSendOtp}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small text-muted">
                          PHONE NUMBER
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 fw-bold">
                            +91
                          </span>
                          <Form.Control
                            type="number"
                            placeholder="98765 43210"
                            className="border-0 bg-light py-3 fw-bold"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </Form.Group>
                      <Button
                        type="submit"
                        variant={isProvider ? "dark" : "primary"}
                        className="w-100 py-3 rounded-pill fw-bold"
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            Get OTP <FiArrowRight />
                          </>
                        )}
                      </Button>
                    </Form>
                  )}

                  {step === 2 && (
                    <Form onSubmit={handleVerify}>
                      <div className="text-center mb-4">
                        <small className="text-muted">
                          OTP sent to +91 {phone}
                        </small>{" "}
                        <br />
                        <small
                          className="text-primary cursor-pointer"
                          onClick={() => setStep(1)}
                        >
                          Change Number
                        </small>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">
                          ENTER OTP
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="1 2 3 4"
                          className="border-0 bg-light py-3 fw-bold text-center fs-4 letter-spacing-2"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={4}
                          autoFocus
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">
                          FULL NAME (If New)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Name"
                          className="border-0 bg-light py-3"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </Form.Group>

                      {/* CATEGORY SELECTOR - ONLY FOR PROVIDERS 
                      {isProvider && (
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold small text-muted">
                            PROFESSION (If New)
                          </Form.Label>
                          <Form.Select
                            className="border-0 bg-light py-3"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option value="Plumbing">Plumber</option>
                            <option value="Cleaning">Cleaner</option>
                            <option value="Salon">Salon Specialist</option>
                            <option value="Electrician">Electrician</option>
                            <option value="Painting">Painter</option>
                          </Form.Select>
                          <Form.Text className="text-muted x-small">
                            *Existing partners: This selection is ignored.
                          </Form.Text>
                        </Form.Group>
                      )}
                        */}

                      <Button
                        type="submit"
                        variant={isProvider ? "dark" : "primary"}
                        className="w-100 py-3 rounded-pill fw-bold"
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            Verify & Login <FiLock />
                          </>
                        )}
                      </Button>
                    </Form>
                  )}

                  <div className="mt-4 text-center border-top pt-3">
                    {!isProvider ? (
                      <p className="small text-muted">
                        Are you a professional?
                        <span
                          className="text-dark fw-bold ms-1 cursor-pointer"
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                          onClick={() => {
                            setIsProvider(true);
                            setStep(1);
                          }}
                        >
                          Join as a Partner
                        </span>
                      </p>
                    ) : (
                      <p className="small text-muted">
                        Looking for services?
                        <span
                          className="text-primary fw-bold ms-1 cursor-pointer"
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                          onClick={() => {
                            setIsProvider(false);
                            setStep(1);
                          }}
                        >
                          Login as Customer
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <Link
                      to="/admin-login"
                      className="small text-muted text-decoration-none"
                    >
                      Admin Access
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
