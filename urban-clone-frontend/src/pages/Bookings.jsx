/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Spinner,
  Modal,
  Form,
  Button,
  ProgressBar,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiStar,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiMessageSquare,
  FiXCircle,
  FiCheckCircle,
  FiNavigation,
  FiTool,
  FiCreditCard,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "../context/AuthContext";
import ChatBox from "../components/UI/ChatBox";
import TrackingModal from "../components/UI/TrackingModal";
import TimeSlotPicker from "../components/UI/TimeSlotPicker";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  // Modals State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [showChat, setShowChat] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);

  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackBookingId, setTrackBookingId] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");

  const { user } = useContext(AuthContext);

  const fetchBookings = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/bookings/mybookings", config);
      setBookings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  // --- Handlers ---
  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };
  const handleOpenChat = (booking) => {
    setChatBooking(booking);
    setShowChat(true);
  };
  const handleTrackClick = (id) => {
    setTrackBookingId(id);
    setShowTrackModal(true);
  };
  const handleOpenCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleOpenReschedule = (booking) => {
    setBookingToReschedule(booking);
    setNewDate(booking.date);
    setNewTimeSlot(booking.timeSlot);
    setShowRescheduleModal(true);
  };

  const confirmReschedule = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `/api/bookings/${bookingToReschedule._id}/reschedule`,
        { date: newDate, timeSlot: newTimeSlot },
        config,
      );
      toast.success("Booking rescheduled successfully!");
      setShowRescheduleModal(false);
      setBookingToReschedule(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reschedule failed");
    }
  };

  const confirmCancellation = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `/api/bookings/${bookingToCancel._id}/cancel`,
        {},
        config,
      );
      toast.success("Booking cancelled successfully.");
      setShowCancelModal(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancellation failed");
    }
  };

  const submitReview = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(
        "/api/reviews",
        { bookingId: selectedBooking._id, rating, comment },
        config,
      );
      toast.success("Review Submitted!");
      setShowReviewModal(false);
      setComment("");
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting review");
    }
  };
  // --- 🌟 SPRINT 9 V3: Ghost Booking Helper ---
  const isGhostBooking = (b) =>
    b.status === "pending" &&
    b.paymentMethod !== "cash" &&
    b.paymentStatus === "pending";

  const getProgressValue = (status) => {
    switch (status) {
      case "pending":
        return 15;
      case "accepted":
        return 40;
      case "ontheway":
        return 65;
      case "arrived":
        return 80;
      case "inprogress":
        return 90;
      case "completed":
        return 100;
      case "cancelled":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusColor = (b) => {
    if (isGhostBooking(b)) return "danger";
    if (b.status === "cancelled") return "danger";
    if (b.status === "completed") return "success";
    if (b.status === "pending") return "warning";
    return "primary";
  };

  const getStatusText = (b) => {
    switch (b.status) {
      case "pending":
        return "Finding Professional";
      case "accepted":
        return "Professional Assigned";
      case "ontheway":
        return "Partner on the way";
      case "arrived":
        return "Partner Arrived";
      case "inprogress":
        return "Job in Progress";
      case "completed":
        return "Service Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return b.status;
    }
  };

  // const filteredBookings = bookings.filter((b) => {
  //   const isPast = b.status === "completed" || b.status === "cancelled";
  //   return filter === "active" ? !isPast : isPast;
  // });
  const filteredBookings = bookings.filter((b) => {
    // 🌟 Moves Payment Failed to the Past tab automatically!
    const isPast =
      b.status === "completed" || b.status === "cancelled" || isGhostBooking(b);
    return filter === "active" ? !isPast : isPast;
  });

  if (!user) {
    return (
      <Container className="text-center mt-5 pt-5">
        <h3>Please login to view bookings</h3>
        <Link to="/login" className="btn btn-primary mt-3 btn-primary-custom">
          Login
        </Link>
      </Container>
    );
  }

  return (
    <>
      <div
        style={{
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          paddingTop: "120px",
          paddingBottom: "80px",
        }}
      >
        <Container fluid="xl" className="px-lg-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
            <div>
              <h2 className="fw-bold mb-1 text-dark">My Bookings</h2>
              <p className="text-muted mb-0">
                Manage your upcoming and past services
              </p>
            </div>
            <div className="d-flex gap-2 p-1 bg-white rounded-pill shadow-sm border">
              {/* <div
                className={`booking-filter-pill ${filter === "active" ? "active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Active (
                {
                  bookings.filter(
                    (b) => b.status !== "completed" && b.status !== "cancelled",
                  ).length
                }
                )
              </div> */}
              <div
                className={`booking-filter-pill ${filter === "active" ? "active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Active (
                {
                  bookings.filter(
                    (b) =>
                      b.status !== "completed" &&
                      b.status !== "cancelled" &&
                      !isGhostBooking(b),
                  ).length
                }
                )
              </div>
              <div
                className={`booking-filter-pill ${filter === "past" ? "active" : ""}`}
                onClick={() => setFilter("past")}
              >
                Past (
                {
                  bookings.filter(
                    (b) =>
                      b.status === "completed" ||
                      b.status === "cancelled" ||
                      isGhostBooking(b),
                  ).length
                }
                )
              </div>
              {/* <div
                className={`booking-filter-pill ${filter === "past" ? "active" : ""}`}
                onClick={() => setFilter("past")}
              >
                Past (
                {
                  bookings.filter(
                    (b) => b.status === "completed" || b.status === "cancelled",
                  ).length
                }
                )
              </div> */}
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5 py-5">
              <Spinner
                animation="border"
                style={{ color: "var(--accent-color)" }}
              />
            </div>
          ) : filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5 mt-4"
            >
              <div
                className="bg-white p-5 rounded-4 shadow-sm d-inline-block border"
                style={{ maxWidth: "400px" }}
              >
                <FiCalendar size={60} className="text-muted mb-4 opacity-50" />
                <h4 className="fw-bold text-dark mb-2">No {filter} bookings</h4>
                <p className="text-muted mb-4">
                  You don't have any {filter} services right now.
                </p>
                <Link to="/services">
                  <Button
                    variant="dark"
                    className="rounded-pill px-5 py-3 fw-bold btn-primary-custom w-100"
                  >
                    Book a Service
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <Row className="g-4">
              <AnimatePresence>
                {filteredBookings.map((booking) => (
                  <Col key={booking._id} lg={6}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="h-100"
                    >
                      <div className="premium-booking-card h-100 d-flex flex-column">
                        {/* 🌟 REDESIGNED HEADER: Clean Status Left, Subtle ID Right 🌟 */}
                        <div className="booking-card-header">
                          <div className="d-flex align-items-center gap-2">
                            {booking.status === "completed" ? (
                              <FiCheckCircle className="text-success" />
                            ) : booking.status === "cancelled" ? (
                              <FiXCircle className="text-danger" />
                            ) : booking.status === "inprogress" ? (
                              <FiTool className="text-primary" />
                            ) : (
                              <FiClock className="text-warning" />
                            )}
                            <span
                              className={`fw-bold text-${getStatusColor(booking)} text-uppercase`}
                              style={{
                                fontSize: "13px",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {getStatusText(booking)}
                            </span>
                          </div>
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              letterSpacing: "1px",
                              fontFamily: "monospace",
                            }}
                          >
                            #{booking._id.slice(-8).toUpperCase()}
                          </span>
                        </div>

                        {/* BODY: Service Info */}
                        <div className="p-4 d-flex flex-column flex-sm-row gap-4 align-items-sm-center">
                          <img
                            src={
                              booking.service?.image ||
                              "https://via.placeholder.com/100"
                            }
                            alt="service"
                            className="shadow-sm"
                            style={{
                              width: "90px",
                              height: "90px",
                              borderRadius: "12px",
                              objectFit: "cover",
                              border: "1px solid #f1f5f9",
                            }}
                          />
                          <div className="flex-grow-1">
                            <Badge
                              bg="light"
                              text="dark"
                              className="border mb-2 px-2 py-1 fw-bold"
                            >
                              {booking.service?.category?.name || "Service"}
                            </Badge>
                            <h5
                              className="fw-bold mb-2 text-dark"
                              style={{ fontSize: "1.1rem" }}
                            >
                              {booking.service?.name || "Service Unavailable"}
                            </h5>
                            {/* <div className="d-flex flex-wrap gap-3 text-muted small fw-bold">
                              <div className="d-flex align-items-center">
                                <FiCalendar className="me-1" /> {booking.date}
                              </div>
                              <div className="d-flex align-items-center">
                                <FiClock className="me-1" /> {booking.timeSlot}
                              </div>
                            </div> */}
                            <div className="d-flex flex-wrap gap-3 text-muted small fw-bold mb-2">
                              <div className="d-flex align-items-center">
                                <FiCalendar className="me-1 text-primary" />{" "}
                                {booking.date}
                              </div>
                              <div className="d-flex align-items-center">
                                <FiClock className="me-1 text-primary" />{" "}
                                {booking.timeSlot}
                              </div>
                            </div>

                            {/* 🌟 NEW: ADDED FULL ADDRESS VISIBILITY 🌟 */}
                            <div className="d-flex align-items-start text-muted small fw-bold mt-1">
                              <FiMapPin className="me-1 mt-1 text-danger flex-shrink-0" />
                              <span
                                style={{
                                  wordBreak: "break-word",
                                  lineHeight: "1.4",
                                }}
                              >
                                {booking.address}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm-end border-start-sm ps-sm-4 mt-3 mt-sm-0">
                            <small
                              className="text-muted d-block fw-bold mb-1"
                              style={{
                                fontSize: "10px",
                                letterSpacing: "0.5px",
                              }}
                            >
                              TOTAL AMOUNT
                            </small>
                            <h4 className="fw-bold text-dark mb-1">
                              ₹{booking.totalPrice || booking.service?.price}
                            </h4>
                            <div
                              className="d-flex align-items-center gap-1 justify-content-sm-end text-muted"
                              style={{ fontSize: "11px" }}
                            >
                              <FiCreditCard />{" "}
                              {booking.paymentMethod?.toUpperCase() || "CASH"}
                            </div>
                          </div>
                        </div>

                        {/* PROGRESS BAR (Only if active) */}
                        {/* {filter === "active" && (
                          <div className="px-4 pb-3 booking-progress-wrapper"> */}
                        {/* PROGRESS BAR (Only if active & paid/cash) */}
                        {filter === "active" && !isGhostBooking(booking) && (
                          <div className="px-4 pb-3 booking-progress-wrapper">
                            <ProgressBar
                              now={getProgressValue(booking.status)}
                              variant={getStatusColor(booking.status)}
                              style={{
                                borderColor: `var(--bs-${getStatusColor(booking.status)})`,
                              }}
                            />
                            <div
                              className="d-flex justify-content-between mt-2 text-muted fw-bold"
                              style={{ fontSize: "10px" }}
                            >
                              <span>Assigned</span>
                              <span>Arrived</span>
                              <span>Done</span>
                            </div>
                          </div>
                        )}

                        {/* SECURITY OTP BLOCKS */}
                        {(booking.status === "arrived" &&
                          booking.startJobOtp) ||
                        (booking.status === "inprogress" &&
                          booking.endJobOtp) ? (
                          <div className="px-4 pb-2">
                            <div className="secure-otp-box shadow-sm">
                              <small
                                className="text-success fw-bold d-block mb-1 text-uppercase"
                                style={{ letterSpacing: "1px" }}
                              >
                                {booking.status === "arrived"
                                  ? "Share to Start Job"
                                  : "Share to Complete Job"}
                              </small>
                              <p className="otp-code">
                                {booking.status === "arrived"
                                  ? booking.startJobOtp
                                  : booking.endJobOtp}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {/* FOOTER: Actions */}
                        <div className="p-3 bg-light border-top mt-auto d-flex flex-wrap gap-2 justify-content-end align-items-center">
                          {/* Active State Actions */}
                          {[
                            "accepted",
                            "ontheway",
                            "arrived",
                            "inprogress",
                          ].includes(booking.status) && (
                            <Button
                              variant="outline-dark"
                              size="sm"
                              className="rounded-pill fw-bold px-4 bg-white shadow-sm"
                              onClick={() => handleOpenChat(booking)}
                            >
                              <FiMessageSquare className="me-1" /> Chat
                            </Button>
                          )}

                          {booking.status === "ontheway" && (
                            <Button
                              variant="dark"
                              size="sm"
                              className="rounded-pill fw-bold px-4 btn-primary-custom shadow-sm"
                              onClick={() => handleTrackClick(booking._id)}
                            >
                              <FiNavigation className="me-1" /> Track Live
                            </Button>
                          )}

                          {/* Pre-job Actions */}
                          {/* {["pending", "accepted"].includes(booking.status) && (
                            <div className="d-flex gap-2 ms-auto">
                              <Button
                                variant="link"
                                size="sm"
                                className="text-dark fw-bold text-decoration-none"
                                onClick={() => handleOpenReschedule(booking)}
                              >
                                Reschedule
                              </Button> */}
                          {/* Pre-job Actions */}
                          {["pending", "accepted"].includes(booking.status) &&
                            !isGhostBooking(booking) && (
                              <div className="d-flex gap-2 ms-auto">
                                {!isGhostBooking(booking) && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-dark fw-bold text-decoration-none"
                                    onClick={() =>
                                      handleOpenReschedule(booking)
                                    }
                                  >
                                    Reschedule
                                  </Button>
                                )}
                                {/* Cancel Button */}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger fw-bold text-decoration-none"
                                  onClick={() => handleOpenCancel(booking)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}

                          {/* Post-Job Actions */}
                          {booking.status === "completed" &&
                            !booking.isReviewed && (
                              <Button
                                variant="dark"
                                size="sm"
                                className="rounded-pill fw-bold px-4 btn-primary-custom w-100 w-sm-auto shadow-sm"
                                onClick={() => handleOpenReview(booking)}
                              >
                                <FiStar className="me-1" /> Rate Professional
                              </Button>
                            )}

                          {booking.status === "completed" &&
                            booking.isReviewed && (
                              <div className="text-success fw-bold small d-flex align-items-center px-3">
                                <FiCheckCircle className="me-1" /> Reviewed
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  </Col>
                ))}
              </AnimatePresence>
            </Row>
          )}

          {/* ================= MODALS ================= */}

          <Modal
            show={showReviewModal}
            onHide={() => setShowReviewModal(false)}
            centered
            className="border-0"
          >
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">
                Rate Professional
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center pt-2">
              <p className="text-muted small">
                How was your experience with the service?
              </p>
              <div className="d-flex justify-content-center gap-2 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    size={40}
                    fill={star <= rating ? "#fbbf24" : "none"}
                    color={star <= rating ? "#fbbf24" : "#cbd5e1"}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    }}
                    onClick={() => setRating(star)}
                    className="hover-scale"
                  />
                ))}
              </div>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a brief review..."
                className="bg-light border-0 rounded-4 p-3"
              />
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button
                variant="dark"
                onClick={submitReview}
                className="w-100 rounded-pill py-3 fw-bold btn-primary-custom"
              >
                Submit Review
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showCancelModal}
            onHide={() => setShowCancelModal(false)}
            centered
          >
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold text-danger">
                Cancel Booking?
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              <p className="text-dark">
                Are you sure you want to cancel this booking?
              </p>
              <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-4 small mb-2 border border-danger border-opacity-25">
                <strong className="d-block mb-2">Cancellation Policy:</strong>
                <ul className="mb-0 ps-3 lh-lg">
                  <li>
                    Free cancellation if done 2+ hours before the scheduled
                    time.
                  </li>
                  <li>
                    A fee of <strong>₹100</strong> will be deducted if cancelled
                    within 2 hours.
                  </li>
                  <li>Refunds will be credited to your Wallet instantly.</li>
                </ul>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 d-flex flex-nowrap">
              <Button
                variant="light"
                className="rounded-pill fw-bold w-50 py-2 shadow-sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                className="rounded-pill fw-bold w-50 py-2 shadow-sm"
                onClick={confirmCancellation}
              >
                Yes, Cancel it
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showRescheduleModal}
            onHide={() => setShowRescheduleModal(false)}
            centered
            size="md"
          >
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold text-dark">
                Reschedule Booking
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              <p className="text-muted small mb-4">
                Select a new date and time for your service. If a professional
                was already assigned, they may be changed based on availability.
              </p>
              <TimeSlotPicker
                selectedDate={newDate}
                setSelectedDate={setNewDate}
                selectedTime={newTimeSlot}
                setSelectedTime={setNewTimeSlot}
                serviceId={bookingToReschedule?.service?._id}
              />
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 d-flex flex-nowrap">
              <Button
                variant="light"
                className="rounded-pill fw-bold w-50 py-2 shadow-sm"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                className="rounded-pill fw-bold w-50 py-2 btn-primary-custom shadow-sm"
                onClick={confirmReschedule}
              >
                Confirm Time
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>

      <ChatBox
        show={showChat}
        handleClose={() => setShowChat(false)}
        booking={chatBooking}
        currentUser={user}
      />
      <TrackingModal
        show={showTrackModal}
        handleClose={() => setShowTrackModal(false)}
        bookingId={trackBookingId}
      />
    </>
  );
};

export default Bookings;
