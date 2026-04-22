import React, { useContext, useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, InputGroup } from "react-bootstrap";
import {
  FiArrowLeft,
  FiTag,
  FiXCircle,
  FiStar,
  FiTrash2,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartContext from "../context/CartContext";
import AuthContext from "../context/AuthContext";

const Cart = () => {
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart, // Ensure this is extracted
    cartTotal,
    promoCode,
    discount,
    taxes,
    platformFee,
    grandTotal,
    applyPromo,
    removePromo,
  } = useContext(CartContext);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [upsells, setUpsells] = useState([]);
  // App config state to check if operations are paused
  const [appConfig, setAppConfig] = useState({ isOperationsPaused: false });

  useEffect(() => {
    axios
      .get("/api/config")
      .then((res) => setAppConfig(res.data))
      .catch((err) => console.log(err));
  }, []);
  // end of app config fetch

  // Fetch "People also take" items
  useEffect(() => {
    const fetchUpsells = async () => {
      try {
        const { data } = await axios.get("/api/services");
        const cartIds = cartItems.map((item) => item._id);
        // Filter out services already in the cart
        const availableUpsells = data.filter(
          (service) => !cartIds.includes(service._id),
        );
        // Take the first 5
        setUpsells(availableUpsells.slice(0, 5));
      } catch (error) {
        console.error("Error fetching upsells", error);
      }
    };
    fetchUpsells();
  }, [cartItems]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim() !== "") {
      applyPromo(couponInput);
      setCouponInput("");
    }
  };

  const handleDecreaseQty = (id, currentQty) => {
    if (currentQty === 1) {
      removeFromCart(id);
    } else {
      updateQuantity(id, currentQty - 1);
    }
  };

  // If cart is empty, show empty state
  if (cartItems.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          paddingTop: "120px",
        }}
      >
        <Container className="text-center py-5 mt-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/102/102665.png"
            alt="Empty Cart"
            style={{ width: "100px", opacity: 0.3, marginBottom: "20px" }}
          />
          <h4 className="fw-bold text-dark mb-2">No items in your cart</h4>
          <p className="text-muted mb-4">
            Looks like you haven't added any services yet.
          </p>
          <Button
            variant="dark"
            className="rounded-pill px-5 py-3 fw-bold btn-primary-custom"
            onClick={() => navigate("/services")}
          >
            Explore Services
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
      }}
    >
      <Container fluid="xl" className="px-lg-5">
        <div
          className="mb-4 d-flex align-items-center cursor-pointer"
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer", display: "inline-flex" }}
        >
          <FiArrowLeft size={24} className="me-3 text-dark" />
          <h3 className="fw-bold m-0 text-dark">Your cart</h3>
        </div>

        <Row className="g-5">
          {/* LEFT: CART ITEMS & UPSELLS */}
          <Col lg={7}>
            {/* Green Savings Banner */}
            {discount > 0 && (
              <div className="bg-success bg-opacity-10 text-success px-4 py-3 rounded-3 mb-4 d-flex align-items-center fw-bold border border-success border-opacity-25">
                <FiTag className="me-2" size={18} /> Saving ₹
                {discount.toFixed(2)} on this order
              </div>
            )}

            {/* Cart Items List */}
            <div className="d-flex flex-column gap-4 mb-5">
              {cartItems.map((item, index) => {
                const fakeOriginalPrice = Math.round(item.price * 1.1); // For the strikethrough effect
                return (
                  <div
                    key={item._id}
                    className={
                      index !== cartItems.length - 1
                        ? "border-bottom pb-4"
                        : "pb-2"
                    }
                  >
                    <p
                      className="text-muted small fw-bold text-uppercase mb-3"
                      style={{ letterSpacing: "0.5px" }}
                    >
                      {item.category} PACK
                    </p>
                    <div className="d-flex justify-content-between align-items-start">
                      {/* Left side: Image & Text */}
                      <div className="d-flex align-items-start pe-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="shadow-sm flex-shrink-0"
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "12px",
                            objectFit: "cover",
                            border: "1px solid #f1f5f9",
                          }}
                        />
                        <div className="ms-3">
                          <h6
                            className="fw-bold text-dark mb-1"
                            style={{ fontSize: "16px", lineHeight: "1.3" }}
                          >
                            {item.name}
                          </h6>
                          <ul className="list-unstyled mb-0 mt-2">
                            <li className="text-muted small mb-1 d-flex align-items-center">
                              <span
                                className="me-2"
                                style={{ fontSize: "8px" }}
                              >
                                ⚫
                              </span>{" "}
                              Base service charge
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Right side: Price & Controls */}
                      <div className="d-flex flex-column align-items-end">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <span className="fw-bold text-dark fs-6">
                            ₹{item.price * item.qty}
                          </span>
                          <span className="text-muted text-decoration-line-through small">
                            ₹{fakeOriginalPrice * item.qty}
                          </span>
                        </div>

                        {/* Teal Quantity Controller */}
                        <div className="cart-qty-ctrl shadow-sm bg-white">
                          <button
                            onClick={() =>
                              handleDecreaseQty(item._id, item.qty)
                            }
                          >
                            {item.qty === 1 ? (
                              <FiTrash2 size={14} className="text-danger" />
                            ) : (
                              "-"
                            )}
                          </button>
                          <span>{item.qty}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.qty + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* People Also Take (Upsells) */}
            {upsells.length > 0 && (
              <div className="pt-2">
                <h4 className="fw-bold text-dark mb-4">People also take</h4>
                <div className="horizontal-scroll-container ms-n1">
                  {upsells.map((u) => (
                    <div key={u._id} className="upsell-card">
                      <img src={u.image} alt={u.name} />
                      <div
                        className="text-truncate text-dark fw-bold mb-1"
                        style={{ fontSize: "14px" }}
                      >
                        {u.name}
                      </div>
                      <div className="d-flex align-items-center small text-muted mb-2">
                        <FiStar
                          fill="#64748b"
                          color="#64748b"
                          size={12}
                          className="me-1"
                        />
                        <span>{u.rating?.toFixed(1) || "4.8"}</span>
                        <span className="ms-1">({u.numReviews || "12K"})</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span
                          className="fw-bold text-dark"
                          style={{ fontSize: "14px" }}
                        >
                          ₹{u.price}
                        </span>
                        <div style={{ width: "65px" }}>
                          <button
                            className="upsell-add-btn"
                            onClick={() => addToCart(u)}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Col>

          {/* RIGHT: DETAILED INVOICE SUMMARY */}
          <Col lg={5}>
            <div className="sticky-top" style={{ top: "120px" }}>
              <h4 className="fw-bold mb-4 text-dark">Payment summary</h4>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-dark">Item total</span>
                <span className="fw-bold text-dark">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              {discount > 0 && (
                <div className="d-flex justify-content-between mb-3 text-success">
                  <span>Pack discount</span>
                  <span className="fw-bold">- ₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-4">
                <span
                  className="text-dark text-decoration-underline"
                  style={{
                    textUnderlineOffset: "4px",
                    textDecorationStyle: "dashed",
                    textDecorationColor: "#cbd5e1",
                  }}
                >
                  Taxes and Fee
                </span>
                <span className="text-dark">
                  ₹{(taxes + platformFee).toFixed(2)}
                </span>
              </div>

              <div className="border-top py-3 mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark">Total amount</span>
                  <span className="fw-bold text-dark">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold text-dark fs-5">Amount to pay</span>
                <span className="fw-bold fs-4 text-dark">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* COUPONS BOX */}
              {promoCode ? (
                <div
                  className="coupon-box mb-4"
                  style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}
                >
                  <div className="coupon-icon-wrap bg-success">%</div>
                  <div className="flex-grow-1">
                    <span className="fw-bold d-block text-dark text-uppercase">
                      {promoCode} applied
                    </span>
                    <small className="text-success fw-bold">
                      ₹{discount.toFixed(2)} savings
                    </small>
                  </div>
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={removePromo}
                  >
                    <FiXCircle size={20} />
                  </Button>
                </div>
              ) : (
                <div
                  className="coupon-box mb-4"
                  onClick={() => setShowCouponInput(!showCouponInput)}
                >
                  <div className="coupon-icon-wrap">%</div>
                  <div>
                    <span className="fw-bold d-block text-dark">
                      Coupons and offers
                    </span>
                    <small className="text-muted">
                      Login/Sign up to view offers
                    </small>
                  </div>
                </div>
              )}

              {/* Expandable Input for Coupon */}
              {showCouponInput && !promoCode && (
                <Form
                  onSubmit={handleApplyCoupon}
                  className="mb-4 animate-pulse"
                  style={{ animation: "none" }}
                >
                  <InputGroup className="shadow-sm rounded-3 overflow-hidden border">
                    <Form.Control
                      placeholder="Enter Coupon Code (e.g. WELCOME50)"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      className="border-0 bg-white px-4 py-3"
                      style={{ textTransform: "uppercase", fontSize: "14px" }}
                    />
                    <Button
                      type="submit"
                      variant="dark"
                      className="fw-bold px-4 btn-primary-custom"
                      style={{ borderRadius: 0 }}
                    >
                      Apply
                    </Button>
                  </InputGroup>
                </Form>
              )}

              {/* ACTION BUTTON */}
              {/* <Button
                variant="dark"
                className="w-100 py-3 rounded-3 fw-bold btn-primary-custom d-flex justify-content-center align-items-center fs-6 mt-3 shadow-lg"
                onClick={() => {
                  if (!user) navigate("/login");
                  else navigate("/checkout");
                }}
              >
                {!user ? "Login/Sign up to proceed" : "Proceed to checkout"}
              </Button> */}
              {/* ACTION BUTTON */}
              {appConfig.isOperationsPaused ? (
                <Button
                  variant="danger"
                  size="lg"
                  className="w-100 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center fs-6 mt-3 shadow-sm opacity-75"
                  disabled
                >
                  Operations Temporarily Paused
                </Button>
              ) : (
                <Button
                  variant="dark"
                  size="lg"
                  className="w-100 py-3 rounded-3 fw-bold btn-primary-custom d-flex justify-content-center align-items-center fs-6 mt-3 shadow-lg"
                  onClick={() => {
                    if (!user) navigate("/login");
                    else navigate("/checkout");
                  }}
                >
                  {!user ? "Login/Sign up to proceed" : "Proceed to checkout"}
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;
