import React, { useState, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { FiShield } from "react-icons/fi";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); // Use the original login function (email/pass)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate("/admin");
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={5} lg={4}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="bg-white p-5 text-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <FiShield size={30} className="text-danger" />
                </div>
                <h4 className="fw-bold">Admin Portal</h4>
                <p className="text-muted small">Restricted Access Only</p>

                <Form onSubmit={handleSubmit} className="text-start mt-4">
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">EMAIL</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold">PASSWORD</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="danger"
                    className="w-100 fw-bold py-2"
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Secure Login"}
                  </Button>
                </Form>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
