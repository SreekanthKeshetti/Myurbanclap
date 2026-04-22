/* eslint-disable no-unused-vars */
import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiShield,
  FiSmartphone,
  FiDollarSign,
  FiChevronLeft,
  FiTag,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext";
import TimeSlotPicker from "../components/UI/TimeSlotPicker";
import MapPicker from "../components/UI/MapPicker";

const Checkout = () => {
  const {
    cartItems,
    cartTotal,
    clearCart,
    promoCode,
    discount,
    taxes,
    platformFee,
    grandTotal,
    applyPromo,
    removePromo,
    useWallet,
    setUseWallet,
    amountToPay, // 🌟 NEW: Extract wallet states
  } = useContext(CartContext);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    if (cartItems.length === 0) navigate("/services");
  }, [cartItems, navigate]);

  if (cartItems.length === 0) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (couponInput.trim() !== "") {
      const success = await applyPromo(couponInput);
      if (success) setCouponInput("");
    }
  };

  const handlePayment = async (createdBookings) => {
    try {
      const bookingIds = createdBookings.map((b) => b._id);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      // 🌟 NEW: Send `useWallet` flag to Backend
      const { data: order } = await axios.post(
        "/api/payment/create-order",
        { bookingIds, promoCode, useWallet },
        config,
      );

      const options = {
        key: "rzp_test_SMT0KbNTtnsRP8",
        amount: order.amount,
        currency: "INR",
        name: "Urban Clone",
        description: `Payment for ${cartItems.length} services`,
        order_id: order.id,
        handler: async function (response) {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingIds: bookingIds,
            useWallet, // 🌟 Pass to verify so DB drops wallet balance
            promoCode,
          };

          await axios.post("/api/payment/verify", verifyData, config);

          const receiptData = {
            items: cartItems,
            grandTotal: grandTotal,
            paymentMethod: "online",
            promoCode,
            discount,
            taxes,
            date,
            timeSlot,
            address,
          };

          // Update local storage so the UI updates instantly
          if (useWallet) {
            const updatedUser = {
              ...user,
              walletBalance:
                user.walletBalance - Math.min(grandTotal, user.walletBalance),
            };
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
            // Note: In a real app, you'd update Context here too, but page reload on success handles it.
          }

          clearCart();
          navigate("/order-success", { state: { orderData: receiptData } });
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#0f172a" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast.error("Payment initialization failed");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot || !address)
      return toast.error("Please fill in date, time and address");

    setLoading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data: createdBookings } = await axios.post(
        "/api/bookings/bulk",
        {
          cartItems,
          date,
          timeSlot,
          address,
          location: coordinates ? { type: "Point", coordinates } : undefined,
          paymentMethod:
            useWallet && amountToPay === 0
              ? "online"
              : paymentMethod !== "cash"
                ? "online"
                : "cash",
        },
        config,
      );

      // 🌟 NEW: 100% WALLET BYPASS LOGIC 🌟
      if (useWallet && amountToPay === 0) {
        await axios.post(
          "/api/payment/wallet-pay",
          { bookingIds: createdBookings.map((b) => b._id), promoCode },
          config,
        );

        // Update local state instantly
        const updatedUser = {
          ...user,
          walletBalance: user.walletBalance - grandTotal,
        };
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));

        const receiptData = {
          items: cartItems,
          grandTotal: grandTotal,
          paymentMethod: "Wallet Paid",
          promoCode,
          discount,
          taxes,
          date,
          timeSlot,
          address,
        };
        setLoading(false);
        clearCart();
        navigate("/order-success", { state: { orderData: receiptData } });
      } else if (paymentMethod !== "cash") {
        // Standard Razorpay Flow (Partial Wallet or Card/UPI)
        handlePayment(createdBookings);
        setLoading(false);
      } else {
        // Cash Flow (Wallet Disabled)
        setLoading(false);
        const receiptData = {
          items: cartItems,
          grandTotal: grandTotal,
          paymentMethod: "cash",
          promoCode,
          discount,
          taxes,
          date,
          timeSlot,
          address,
        };
        clearCart();
        navigate("/order-success", { state: { orderData: receiptData } });
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Checkout Failed");
    }
  };

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
        <h2 className="fw-bold mb-4">Checkout</h2>
        <Row className="g-4">
          <Col lg={7}>
            {/* SCHEDULE & LOCATION CARD */}
            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3">1. Schedule & Location</h5>
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted mb-2">
                        SELECT DATE & TIME
                      </Form.Label>
                      <TimeSlotPicker
                        selectedDate={date}
                        setSelectedDate={setDate}
                        selectedTime={timeSlot}
                        setSelectedTime={setTimeSlot}
                        serviceId={cartItems[0]?._id}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">
                        <FiMapPin className="me-1" /> DELIVERY LOCATION
                      </Form.Label>
                      <MapPicker
                        setAddress={setAddress}
                        setCoordinates={setCoordinates}
                      />
                      <Form.Control
                        as="textarea"
                        rows={2}
                        className="mt-2"
                        placeholder="House No, Floor..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* PAYMENT METHOD CARD */}
            <Card className="border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">2. Payment Method</h5>

              {/* 🌟 THE WALLET TOGGLE 🌟 */}
              {user?.walletBalance > 0 && (
                <div
                  className={`p-3 mb-3 border rounded-3 transition-all ${useWallet ? "border-success bg-success bg-opacity-10 shadow-sm" : "bg-white"}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="wallet-check"
                      label={
                        <span className="fw-bold ms-1 text-dark">
                          Use Urban Wallet
                        </span>
                      }
                      checked={useWallet}
                      onChange={(e) => {
                        setUseWallet(e.target.checked);
                        if (e.target.checked && paymentMethod === "cash")
                          setPaymentMethod("upi"); // Force online if wallet used
                      }}
                      className="mb-0 custom-switch-premium"
                    />
                    {useWallet && (
                      <span className="fw-bold text-success">
                        - ₹{Math.min(grandTotal, user.walletBalance).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <small className="text-muted ms-4 ps-2 d-block mt-1">
                    Available Balance: ₹{user.walletBalance.toFixed(2)}
                  </small>
                </div>
              )}

              {amountToPay > 0 && (
                <div className="d-grid gap-3">
                  <div
                    className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center justify-content-between ${paymentMethod === "upi" ? "border-primary bg-primary bg-opacity-10" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white p-2 rounded-circle shadow-sm">
                        <FiSmartphone size={20} className="text-success" />
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">UPI / GPay</h6>
                        <small className="text-muted">
                          Instant online payment
                        </small>
                      </div>
                    </div>
                    {paymentMethod === "upi" && (
                      <FiCheckCircle className="text-primary" />
                    )}
                  </div>

                  <div
                    className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center justify-content-between ${paymentMethod === "card" ? "border-primary bg-primary bg-opacity-10" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white p-2 rounded-circle shadow-sm">
                        <FiCreditCard size={20} className="text-dark" />
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">Credit / Debit Card</h6>
                        <small className="text-muted">Secure transaction</small>
                      </div>
                    </div>
                    {paymentMethod === "card" && (
                      <FiCheckCircle className="text-primary" />
                    )}
                  </div>

                  <div
                    className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center justify-content-between ${useWallet ? "opacity-50 bg-light" : paymentMethod === "cash" ? "border-primary bg-primary bg-opacity-10" : ""}`}
                    onClick={() => !useWallet && setPaymentMethod("cash")}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-white p-2 rounded-circle shadow-sm">
                        <FiDollarSign size={20} className="text-warning" />
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">Cash on Delivery</h6>
                        <small className="text-muted">
                          {useWallet
                            ? "Not available with Wallet"
                            : "Pay after service"}
                        </small>
                      </div>
                    </div>
                    {paymentMethod === "cash" && !useWallet && (
                      <FiCheckCircle className="text-primary" />
                    )}
                  </div>
                </div>
              )}
            </Card>
          </Col>

          {/* RIGHT SIDE: SUMMARY */}
          <Col lg={5}>
            <div className="sticky-top" style={{ top: "120px" }}>
              <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                <Card.Header className="bg-white p-4 border-bottom">
                  <h5 className="fw-bold mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    {cartItems.map((item) => (
                      <div
                        key={item._id}
                        className="d-flex justify-content-between mb-2"
                      >
                        <span className="text-muted small">
                          {item.name} x {item.qty}
                        </span>
                        <span className="fw-bold small">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* PROMO BOX */}
                  <div className="mb-4 pb-4 border-bottom border-top pt-4">
                    <h6 className="fw-bold mb-3">
                      <FiTag className="me-2" /> Coupons and Offers
                    </h6>
                    {promoCode ? (
                      <div className="d-flex justify-content-between align-items-center bg-success bg-opacity-10 text-success p-3 rounded-3 border border-success">
                        <div>
                          <span className="fw-bold d-block">
                            '{promoCode}' applied
                          </span>
                          <small>You saved ₹{discount.toFixed(2)}!</small>
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
                      <Form onSubmit={handleApplyCoupon}>
                        <InputGroup>
                          <Form.Control
                            placeholder="Enter Coupon"
                            value={couponInput}
                            onChange={(e) =>
                              setCouponInput(e.target.value.toUpperCase())
                            }
                            className="bg-light border-0"
                            style={{ textTransform: "uppercase" }}
                          />
                          <Button
                            type="submit"
                            variant="dark"
                            className="fw-bold px-4"
                          >
                            Apply
                          </Button>
                        </InputGroup>
                      </Form>
                    )}
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Item Total</span>
                    <span className="fw-bold small">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span className="small">Item Discount</span>
                      <span className="fw-bold small">
                        - ₹{discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Taxes (18% GST)</span>
                    <span className="fw-bold small">₹{taxes.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted small">Platform Fee</span>
                    <span className="fw-bold small">
                      ₹{platformFee.toFixed(2)}
                    </span>
                  </div>

                  {/* 🌟 NEW: GRAND TOTAL VS PAYABLE TOTAL */}
                  <div className="border-top pt-3 mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">Grand Total</span>
                      <span className="fw-bold text-dark">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {useWallet && (
                      <div className="d-flex justify-content-between align-items-center mb-3 text-success">
                        <span className="fw-bold">Wallet Applied</span>
                        <span className="fw-bold">
                          - ₹
                          {Math.min(
                            grandTotal,
                            user?.walletBalance || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4 mt-2 border">
                      <span className="fw-bold fs-5">Amount to Pay</span>
                      <span className="fw-bold fs-4 text-primary">
                        ₹{amountToPay.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-4 text-center justify-content-center">
                    <FiShield className="text-success" />
                    <small className="text-muted">Safe & Secure Payment</small>
                  </div>

                  <Button
                    variant="dark"
                    size="lg"
                    className="w-100 rounded-pill fw-bold btn-primary-custom"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Processing...
                      </>
                    ) : (
                      `Pay ₹${amountToPay.toFixed(2)}`
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Checkout;
