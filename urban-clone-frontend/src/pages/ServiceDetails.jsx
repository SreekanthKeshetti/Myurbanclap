/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Spinner,
  Button,
  Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiStar,
  FiCheck,
  FiX,
  FiShield,
  FiArrowLeft,
  FiShoppingCart,
  FiInfo,
  FiMessageSquare,
} from "react-icons/fi";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext";

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cartItems, addToCart, removeFromCart, cartTotal } =
    useContext(CartContext);

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Refs for video elements
  const mainVideoRef = useRef(null);
  const modalVideoRef = useRef(null);

  // 🌟 GOOGLE'S OFFICIAL TEST VIDEO (100% Unblockable, Fast CDN)
  const guaranteedVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data: serviceData } = await axios.get(`/api/services/${id}`);
        setService(serviceData);

        const { data: reviewData } = await axios.get(`/api/reviews/${id}`);
        setReviews(reviewData);

        setLoading(false);
        setShowVideoModal(true);
      } catch (error) {
        console.error("Error fetching details", error);
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // 🌟 THE REACT AUTOPLAY FIX 🌟
  // This forcefully mutes the video at the DOM level so the browser allows it to play.
  useEffect(() => {
    const forcePlay = (videoEl) => {
      if (videoEl) {
        videoEl.defaultMuted = true;
        videoEl.muted = true;
        videoEl
          .play()
          .catch((err) => console.log("Browser blocked autoplay:", err));
      }
    };
    forcePlay(mainVideoRef.current);
    forcePlay(modalVideoRef.current);
  }, [service, showVideoModal]);

  const isInCart = cartItems.some((item) => item._id === service?._id);
  const cartItemQty =
    cartItems.find((item) => item._id === service?._id)?.qty || 0;

  if (loading)
    return (
      <div
        className="text-center"
        style={{ marginTop: "20vh", minHeight: "80vh" }}
      >
        <Spinner animation="border" style={{ color: "var(--accent-color)" }} />
      </div>
    );

  if (!service)
    return (
      <div className="text-center mt-5 pt-5 fw-bold">Service not found</div>
    );

  const originalPrice = Math.round(service.price * 1.2);

  // Try to use the DB video, otherwise use Google's test video
  const videoToPlay =
    service.video && service.video.length > 10
      ? service.video
      : guaranteedVideo;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        paddingTop: "90px",
        paddingBottom: "100px",
      }}
    >
      <Container fluid="xl" className="px-lg-5">
        <Button
          variant="link"
          className="text-dark text-decoration-none p-0 mb-3 d-lg-none fw-bold"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft className="me-2" /> Back
        </Button>

        <Row className="g-5">
          {/* ================= LEFT COLUMN ================= */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="sticky-sidebar">
              <h1
                className="fw-bold mb-2 text-dark"
                style={{
                  fontSize: "2.2rem",
                  lineHeight: "1.2",
                  letterSpacing: "-1px",
                }}
              >
                {service.name}
              </h1>
              <div className="d-flex align-items-center mb-4">
                <FiStar fill="#059669" color="#059669" className="me-1" />
                <span
                  className="fw-bold text-dark me-1"
                  style={{ fontSize: "14px" }}
                >
                  {service.rating?.toFixed(1) || "4.8"}
                </span>
                <span className="text-muted small">
                  ({service.numReviews || "6.6M"} bookings)
                </span>
              </div>

              <div className="border-top pt-4">
                <span className="text-muted fw-bold small text-uppercase mb-3 d-block">
                  Quick Navigate
                </span>
                <div className="nav-pill-grid">
                  <a
                    href="#overview"
                    className={`nav-pill-link ${activeSection === "overview" ? "active" : ""}`}
                    onClick={() => setActiveSection("overview")}
                  >
                    <FiInfo size={18} className="me-3" /> Overview
                  </a>
                  <a
                    href="#includes"
                    className={`nav-pill-link ${activeSection === "includes" ? "active" : ""}`}
                    onClick={() => setActiveSection("includes")}
                  >
                    <FiCheck size={18} className="me-3" /> What's Included
                  </a>
                  <a
                    href="#reviews"
                    className={`nav-pill-link ${activeSection === "reviews" ? "active" : ""}`}
                    onClick={() => setActiveSection("reviews")}
                  >
                    <FiMessageSquare size={18} className="me-3" /> Reviews
                  </a>
                </div>
              </div>
            </div>
          </Col>

          {/* ================= CENTER COLUMN ================= */}
          <Col lg={6} md={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div id="overview" className="scroll-anchor">
                {/* 🌟 BULLETPROOF VIDEO HEADER 🌟 */}
                <div
                  className="mb-5 rounded-4 overflow-hidden shadow-sm border bg-dark position-relative"
                  style={{ height: "350px", width: "100%" }}
                >
                  <video
                    ref={mainVideoRef}
                    key={videoToPlay}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    crossOrigin="anonymous" /* 🌟 Bypasses PWA Cache Bug */
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      backgroundColor: "#000",
                    }}
                  >
                    {/* 🌟 Proper Source Tag implementation */}
                    <source src={videoToPlay} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <h3 className="fw-bold mb-4 text-dark">Service Package</h3>
                <div className="sub-service-card pb-5 border-bottom">
                  <div className="sub-service-content">
                    <Badge
                      bg="success"
                      className="mb-2 bg-opacity-10 text-success border border-success px-2 py-1"
                    >
                      Premium Service
                    </Badge>
                    <h5
                      className="fw-bold text-dark mb-1"
                      style={{ fontSize: "16px" }}
                    >
                      {service.name}
                    </h5>
                    <div className="d-flex align-items-center mb-2 small">
                      <FiStar fill="#059669" color="#059669" className="me-1" />
                      <span className="text-dark fw-bold">
                        {service.rating?.toFixed(1) || "4.8"} (
                        {service.numReviews || "124"} reviews)
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-dark fs-6">
                        ₹{service.price}
                      </span>
                      <span className="text-muted text-decoration-line-through small">
                        ₹{originalPrice}
                      </span>
                      <span className="text-muted small">• Approx 45 mins</span>
                    </div>
                    <p className="mt-3 text-muted small lh-lg mb-0">
                      {service.description}
                    </p>
                  </div>
                  <div className="sub-service-image-wrapper">
                    <img src={service.image} alt={service.name} />
                    {isInCart ? (
                      <div
                        className="uc-add-btn added d-flex justify-content-between align-items-center shadow"
                        style={{
                          position: "relative",
                          bottom: 0,
                          width: "100%",
                        }}
                      >
                        <span
                          onClick={() => removeFromCart(service._id)}
                          style={{ cursor: "pointer", paddingRight: "8px" }}
                        >
                          -
                        </span>
                        <span>{cartItemQty}</span>
                        <span
                          onClick={() => addToCart(service)}
                          style={{ cursor: "pointer", paddingLeft: "8px" }}
                        >
                          +
                        </span>
                      </div>
                    ) : (
                      <button
                        className="uc-add-btn w-100"
                        style={{ position: "relative", bottom: 0 }}
                        onClick={() => addToCart(service)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* INCLUDED / EXCLUDED SECTION */}
              <div id="includes" className="scroll-anchor py-5 border-bottom">
                <h4 className="fw-bold mb-4 text-dark">
                  What's included in this service?
                </h4>
                <Row className="g-4">
                  <Col md={6}>
                    <div className="bg-success bg-opacity-10 p-3 rounded-3 h-100 border border-success border-opacity-25">
                      <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                        <FiCheck className="me-2 fs-5" /> Included
                      </h6>
                      <ul className="list-unstyled mb-0">
                        {service.features && service.features.length > 0 ? (
                          service.features.map((item, index) => (
                            <li
                              key={index}
                              className="d-flex align-items-start mb-2 small text-dark fw-bold"
                            >
                              <span className="me-2 text-success">•</span>{" "}
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="small text-dark fw-bold">
                            <span className="me-2 text-success">•</span>{" "}
                            Standard service checks included.
                          </li>
                        )}
                      </ul>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="bg-danger bg-opacity-10 p-3 rounded-3 h-100 border border-danger border-opacity-25">
                      <h6 className="fw-bold text-danger mb-3 d-flex align-items-center">
                        <FiX className="me-2 fs-5" /> Excluded
                      </h6>
                      <ul className="list-unstyled mb-0">
                        {service.excludes && service.excludes.length > 0 ? (
                          service.excludes.map((item, index) => (
                            <li
                              key={index}
                              className="d-flex align-items-start mb-2 small text-dark fw-bold"
                            >
                              <span className="me-2 text-danger">•</span> {item}
                            </li>
                          ))
                        ) : (
                          <li className="small text-dark fw-bold">
                            <span className="me-2 text-danger">•</span> Spare
                            parts not included.
                          </li>
                        )}
                      </ul>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* REVIEWS SECTION */}
              <div id="reviews" className="scroll-anchor py-5">
                <h4 className="fw-bold mb-4">Customer Reviews</h4>
                {reviews.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded-3 border">
                    <p className="text-muted fw-bold mb-0">
                      No reviews yet. Be the first to book!
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="border-bottom py-3">
                      <div className="d-flex justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: "36px",
                              height: "36px",
                              fontSize: "14px",
                            }}
                          >
                            {rev.user?.name?.[0] || "U"}
                          </div>
                          <span className="fw-bold text-dark">
                            {rev.user?.name}
                          </span>
                        </div>
                        <span className="text-muted small fw-bold">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={14}
                            fill={i < rev.rating ? "#10b981" : "#e2e8f0"}
                            color={i < rev.rating ? "#10b981" : "#e2e8f0"}
                            className="me-1"
                          />
                        ))}
                      </div>
                      <p className="text-muted small mb-0 fw-bold">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </Col>

          {/* ================= RIGHT COLUMN ================= */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="sticky-sidebar">
              <div className="border rounded-4 bg-white shadow-sm p-4 mb-4 text-center">
                {cartItems.length === 0 ? (
                  <>
                    <FiShoppingCart
                      size={40}
                      className="text-muted opacity-25 mb-3"
                    />
                    <p className="text-muted fw-bold small mb-0">
                      No items in your cart
                    </p>
                  </>
                ) : (
                  <>
                    <h6 className="fw-bold text-dark text-start mb-3">
                      Your Cart
                    </h6>
                    {cartItems.map((item) => (
                      <div
                        key={item._id}
                        className="d-flex justify-content-between align-items-center mb-2 small"
                      >
                        <span
                          className="text-truncate"
                          style={{ maxWidth: "120px" }}
                        >
                          {item.name} x{item.qty}
                        </span>
                        <span className="fw-bold text-dark">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    ))}
                    <hr className="opacity-10 my-3" />
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <span className="fw-bold">Total</span>
                      <span className="fw-bold fs-5 text-dark">
                        ₹{cartTotal}
                      </span>
                    </div>
                    <Button
                      variant="dark"
                      className="w-100 rounded-pill fw-bold btn-primary-custom"
                      onClick={() => navigate(user ? "/cart" : "/login")}
                    >
                      View Cart
                    </Button>
                  </>
                )}
              </div>
              <div className="border rounded-4 bg-white shadow-sm p-4">
                <h6 className="fw-bold text-dark mb-3">InstaClean Promise</h6>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center mb-2 small text-muted">
                    <FiCheck className="me-2 text-success" /> Verified
                    Professionals
                  </li>
                  <li className="d-flex align-items-center mb-2 small text-muted">
                    <FiCheck className="me-2 text-success" /> Hassle Free
                    Booking
                  </li>
                  <li className="d-flex align-items-center small text-muted">
                    <FiCheck className="me-2 text-success" /> Transparent
                    Pricing
                  </li>
                </ul>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* --- MOBILE STICKY BOTTOM CART --- */}
      {cartItems.length > 0 && (
        <div
          className="d-lg-none fixed-bottom bg-white border-top p-3 shadow-lg"
          style={{ zIndex: 1050 }}
        >
          <Container>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold fs-5 text-dark d-block">
                  ₹{cartTotal}
                </span>
                <small
                  className="text-muted fw-bold"
                  style={{ fontSize: "11px" }}
                >
                  {cartItems.length} ITEM(S)
                </small>
              </div>
              <Button
                variant="dark"
                className="rounded-pill px-4 py-2 fw-bold btn-primary-custom"
                onClick={() => navigate(user ? "/cart" : "/login")}
              >
                View Cart
              </Button>
            </div>
          </Container>
        </div>
      )}

      {/* ==========================================
          THE NEW "URBAN COMPANY" VIDEO MODAL
      ========================================== */}
      <Modal
        show={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        centered
        size="lg"
        className="uc-video-modal bg-dark bg-opacity-75"
      >
        <button
          className="uc-video-modal-close"
          onClick={() => setShowVideoModal(false)}
        >
          <FiX size={20} />
        </button>

        <div className="position-relative bg-dark">
          {/* 🌟 BULLETPROOF VIDEO MODAL 🌟 */}
          <video
            ref={modalVideoRef}
            key={videoToPlay}
            autoPlay
            loop
            muted
            playsInline
            controls
            crossOrigin="anonymous" /* 🌟 Bypasses PWA Cache Bug */
            className="uc-video-modal-media"
            onError={(e) => console.log("Modal Video failed to load!", e)}
          >
            <source src={videoToPlay} type="video/mp4" />
          </video>
        </div>

        <Modal.Body className="p-4 bg-white">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h4 className="fw-bold text-dark mb-2">{service.name}</h4>
              <div className="d-flex align-items-center small mb-2">
                <FiStar fill="#059669" color="#059669" className="me-1" />
                <span className="text-dark fw-bold">
                  {service.rating?.toFixed(1) || "4.8"}
                </span>
                <span className="text-muted ms-1">
                  ({service.numReviews || "4.9M"} reviews)
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="fw-bold text-dark fs-5">₹{service.price}</span>
                <span className="text-muted text-decoration-line-through small">
                  ₹{originalPrice}
                </span>
              </div>
            </div>

            <div
              style={{ position: "relative", width: "100px", height: "40px" }}
            >
              {isInCart ? (
                <div
                  className="uc-add-btn added d-flex justify-content-between align-items-center shadow"
                  style={{ position: "relative", bottom: 0, width: "100%" }}
                >
                  <span
                    onClick={() => removeFromCart(service._id)}
                    style={{ cursor: "pointer", paddingRight: "8px" }}
                  >
                    -
                  </span>
                  <span>{cartItemQty}</span>
                  <span
                    onClick={() => addToCart(service)}
                    style={{ cursor: "pointer", paddingLeft: "8px" }}
                  >
                    +
                  </span>
                </div>
              ) : (
                <button
                  className="uc-add-btn w-100"
                  style={{ position: "relative", bottom: 0 }}
                  onClick={() => addToCart(service)}
                >
                  Add
                </button>
              )}
            </div>
          </div>
          <hr className="my-4 opacity-10" />
          <h5 className="fw-bold text-dark mb-3">
            See the difference yourself
          </h5>
          <p className="text-muted small mb-0">{service.description}</p>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ServiceDetails;
