/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
} from "react-bootstrap";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiClock,
  FiLogOut,
  FiEdit2,
  FiSave,
  FiX,
} from "react-icons/fi";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// --- NEW IMPORT: Bring in the MapPicker ---
import MapPicker from "../components/UI/MapPicker";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [bookingCount, setBookingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  // --- NEW STATE: To hold map coordinates ---
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
      });
      fetchBookingStats();
    }
  }, [user]);

  const fetchBookingStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/bookings/mybookings", config);
      setBookingCount(data.length);
    } catch (error) {
      console.error("Error fetching stats");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      // --- NEW: Construct payload with map coordinates if they exist ---
      const payload = {
        ...formData,
        geoLocation: coordinates ? { type: "Point", coordinates } : undefined,
      };

      const { data } = await axios.put("/api/auth/profile", payload, config);

      localStorage.setItem("userInfo", JSON.stringify(data));
      window.location.reload();

      toast.success("Profile Updated Successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center mt-5">Loading...</div>;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "50px",
      }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="g-4">
            {/* LEFT COLUMN: Identity Card */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 text-center p-4">
                <div
                  className="position-relative mx-auto mb-4"
                  style={{ width: "120px", height: "120px" }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow"
                    style={{
                      width: "100%",
                      height: "100%",
                      fontSize: "2.5rem",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                    }}
                  >
                    {initials}
                  </div>
                </div>

                <h3 className="fw-bold mb-1">{user.name}</h3>
                <p className="text-muted mb-3">{user.email}</p>

                <div className="d-flex justify-content-center gap-2 mb-4">
                  <Badge
                    bg="light"
                    text="dark"
                    className="border px-3 py-2 rounded-pill"
                  >
                    <FiShield className="me-1 text-primary" />{" "}
                    {user.role || "Customer"}
                  </Badge>
                  <Badge
                    bg="light"
                    text="dark"
                    className="border px-3 py-2 rounded-pill"
                  >
                    <FiClock className="me-1 text-success" /> Active
                  </Badge>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="outline-danger"
                    onClick={logout}
                    className="rounded-pill py-2 fw-bold"
                  >
                    <FiLogOut className="me-2" /> Logout
                  </Button>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="border-0 shadow-sm rounded-4 mt-4 p-4">
                <h6 className="fw-bold mb-3 text-muted small">ACTIVITY</h6>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>Total Bookings</span>
                  <span className="fw-bold fs-5">{bookingCount}</span>
                </div>
              </Card>
            </Col>

            {/* RIGHT COLUMN: Account Details */}
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Account Settings</h4>
                  {!isEditing ? (
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-pill px-3 fw-bold text-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <FiEdit2 className="me-2" /> Edit Profile
                    </Button>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-pill px-3 fw-bold text-danger"
                        onClick={() => setIsEditing(false)}
                      >
                        <FiX className="me-1" /> Cancel
                      </Button>
                      <Button
                        variant="dark"
                        size="sm"
                        className="rounded-pill px-3 fw-bold btn-primary-custom"
                        onClick={handleUpdateProfile}
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <FiSave className="me-1" /> Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">
                          FULL NAME
                        </Form.Label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        ) : (
                          <div className="d-flex align-items-center p-3 bg-light rounded-3">
                            <FiUser className="text-muted me-3" size={20} />
                            <span className="fw-bold text-dark">
                              {user.name}
                            </span>
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">
                          EMAIL ADDRESS
                        </Form.Label>
                        {isEditing ? (
                          <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            // disabled
                          />
                        ) : (
                          <div className="d-flex align-items-center p-3 bg-light rounded-3">
                            <FiMail className="text-muted me-3" size={20} />
                            <span className="fw-bold text-dark">
                              {user.email}
                            </span>
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">
                          PHONE NUMBER
                        </Form.Label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <div className="d-flex align-items-center p-3 bg-light rounded-3">
                            <FiPhone className="text-muted me-3" size={20} />
                            <span className="text-muted">
                              {user.phone || "Not provided"}
                            </span>
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* --- LOCATION WITH MAP --- */}
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">
                          BASE LOCATION
                        </Form.Label>
                        {isEditing ? (
                          <>
                            {/* The Map Component! */}
                            <div className="mb-2">
                              <MapPicker
                                setAddress={(addr) =>
                                  setFormData({ ...formData, location: addr })
                                }
                                setCoordinates={setCoordinates}
                              />
                            </div>
                            <Form.Control
                              type="text"
                              placeholder="Text address will auto-fill here..."
                              value={formData.location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  location: e.target.value,
                                })
                              }
                            />
                            {user.role === "provider" && (
                              <Form.Text className="text-danger small fw-bold">
                                * Providers: You will only receive jobs within
                                20km of this location.
                              </Form.Text>
                            )}
                          </>
                        ) : (
                          <div className="d-flex align-items-center p-3 bg-light rounded-3">
                            <FiMapPin className="text-muted me-3" size={20} />
                            <span className="text-muted">
                              {user.location ||
                                "Location not set. Click Edit to add via Map."}
                            </span>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default Profile;
