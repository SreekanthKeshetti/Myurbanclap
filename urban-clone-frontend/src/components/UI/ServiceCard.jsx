import React, { useContext } from "react";
import { Card, Button } from "react-bootstrap";
import { FiStar, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CartContext from "../../context/CartContext";

const ServiceCard = ({ service, onBook }) => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useContext(CartContext);
  const isInCart = cartItems.some((item) => item._id === service._id);

  const goToDetails = () => navigate(`/services/${service._id}`);
  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(service);
  };

  const originalPrice = Math.round(service.price * 1.1); // 10% fake markup for UI

  // 🌟 FIXED: Safely figure out what to show in the badge instead of a raw Database ID
  let badgeText = "Premium";
  if (service.categoryName) {
    badgeText = service.categoryName;
  } else if (service.category?.name) {
    badgeText = service.category.name;
  } else if (
    typeof service.category === "string" &&
    service.category.length !== 24
  ) {
    // If it's a string but NOT a 24-character MongoDB ID, use it
    badgeText = service.category;
  }

  return (
    <div
      className="uc-service-card w-100 h-100 d-flex flex-column"
      onClick={goToDetails}
      style={{ maxWidth: "100%" }}
    >
      {/* IMAGE AREA */}
      <div className="img-container p-2 position-relative">
        <div
          className="position-absolute shadow-sm"
          style={{
            top: "16px",
            left: "16px",
            zIndex: 10,
            backgroundColor: "var(--accent-color)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {/* 🌟 Shows a clean word instead of a MongoDB ID */}
          {badgeText}
        </div>
        <img
          src={service.image || "https://via.placeholder.com/300"}
          alt={service.name}
          style={{ height: "200px" }}
        />
      </div>

      <Card.Body className="p-3 pt-2 d-flex flex-column flex-grow-1 border-0 bg-white">
        {/* TITLE & RATING */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5
            className="fw-bold mb-0 text-dark text-truncate pe-2"
            style={{ fontSize: "1.1rem" }}
          >
            {service.name}
          </h5>
          <div className="d-flex align-items-center small bg-light px-2 py-1 rounded border">
            <FiStar className="me-1" fill="#059669" color="#059669" />
            <span className="fw-bold text-dark">
              {service.rating > 0 ? service.rating.toFixed(1) : "4.8"}
            </span>
          </div>
        </div>

        <p
          className="text-muted small mb-3 flex-grow-1"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.5",
          }}
        >
          {service.description}
        </p>

        <hr className="text-muted opacity-10 my-2" />

        {/* PRICING & BUTTONS */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark fs-5">₹{service.price}</span>
              <span className="text-muted text-decoration-line-through small">
                ₹{originalPrice}
              </span>
            </div>
            <small className="text-muted d-block" style={{ fontSize: "10px" }}>
              Starts at
            </small>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant={isInCart ? "light" : "outline-dark"}
              className={`rounded-pill px-3 fw-bold btn-sm ${isInCart ? "text-success border-success bg-success bg-opacity-10" : ""}`}
              onClick={handleAdd}
              disabled={isInCart}
            >
              {isInCart ? (
                <>
                  <FiCheck /> Added
                </>
              ) : (
                "Add +"
              )}
            </Button>
            <Button
              variant="dark"
              className="rounded-pill px-3 btn-sm fw-bold btn-primary-custom"
              onClick={(e) => {
                e.stopPropagation();
                onBook(service);
              }}
            >
              Book
            </Button>
          </div>
        </div>
      </Card.Body>
    </div>
  );
};

export default ServiceCard;
