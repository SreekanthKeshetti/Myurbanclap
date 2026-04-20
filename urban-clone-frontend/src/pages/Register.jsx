import React, { useState, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await register(name, email, password);
    setIsSubmitting(false);
    if (success) navigate("/");
  };

  return (
    <div
      style={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
      }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* THE UNIFIED CARD WRAPPER */}
          <div
            className="bg-white rounded-4 shadow-lg overflow-hidden"
            style={{ maxWidth: "1000px", margin: "0 auto" }}
          >
            <Row className="g-0">
              {/* LEFT SIDE: Form */}
              <Col
                lg={6}
                className="p-5 d-flex align-items-center order-2 order-lg-1"
              >
                <div className="w-100">
                  <div className="mb-5">
                    <h2 className="fw-bold text-dark">Get Started</h2>
                    <p className="text-muted">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="text-primary fw-bold"
                        style={{ textDecoration: "none" }}
                      >
                        Login
                      </Link>
                    </p>
                  </div>

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">
                        FULL NAME
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="p-3 bg-light border-0"
                        placeholder="John Doe"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">
                        EMAIL ADDRESS
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 bg-light border-0"
                        placeholder="name@company.com"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-bold text-secondary">
                        PASSWORD
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 bg-light border-0"
                        placeholder="Create a strong password"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      className="w-100 py-3 fw-bold btn-primary-custom mb-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Spinner size="sm" /> : "Create Account"}
                    </Button>

                    <p className="text-center text-muted small">
                      By signing up, you agree to our{" "}
                      <a href="#" className="text-muted">
                        Terms
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-muted">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </Form>
                </div>
              </Col>

              {/* RIGHT SIDE: Image */}
              <Col
                lg={6}
                className="d-none d-lg-block position-relative order-1 order-lg-2"
              >
                <img
                  src="https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?w=1200&auto=format&fit=crop"
                  alt="Register"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    minHeight: "650px",
                  }}
                />
                {/* Gradient Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  }}
                ></div>

                <div className="position-absolute bottom-0 start-0 p-5 text-white">
                  <h3 className="fw-bold">Join the Professionals.</h3>
                  <p className="lead fs-6">
                    Grow your business or get expert help. It's all here.
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Register;
