/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useContext, useEffect } from "react";
import {
  Button,
  Form,
  Spinner,
  Row,
  Col,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiSmartphone,
  FiDollarSign,
  FiCheckCircle,
  FiChevronLeft,
  FiMinus,
  FiPlus,
  FiTag,
  FiXCircle,
  FiX,
} from "react-icons/fi";
import TimeSlotPicker from "./TimeSlotPicker";
import MapPicker from "./MapPicker";

const BookingModal = ({ show, handleClose, service }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [platformFee, setPlatformFee] = useState(29);
  const [grandTotal, setGrandTotal] = useState(0);
  // --- 🌟 APP CONFIG STATE ---
  const [appConfig, setAppConfig] = useState({ isOperationsPaused: false });

  useEffect(() => {
    if (show) {
      axios
        .get("/api/config")
        .then((res) => setAppConfig(res.data))
        .catch((err) => console.log(err));
    }
  }, [show]);
  // End of 🌟 APP CONFIG STATE

  // 🌟 NEW: Local Wallet States for Modal
  const [useWallet, setUseWallet] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);

  const { user, handleOtpLogin } = useContext(AuthContext); // Can use handleOtpLogin to update context securely
  const navigate = useNavigate();

  const resetAndClose = () => {
    if (loading) return;
    setStep(1);
    setQuantity(1);
    removePromo();
    setUseWallet(false);
    setLoading(false);
    handleClose();
  };

  useEffect(() => {
    if (!service) return;
    const baseTotal = service.price * quantity;

    // Set Platform Fee dynamically based on UrbanPlus
    const hasActivePlus =
      user?.isPlusMember && new Date() < new Date(user?.plusMembershipExpiry);
    const currentPlatformFee = hasActivePlus ? 0 : 29;
    setPlatformFee(currentPlatformFee);

    if (!promoCode) {
      const calculatedTaxes = baseTotal * 0.18;
      setTaxes(calculatedTaxes);
      setGrandTotal(baseTotal + calculatedTaxes + currentPlatformFee);
    } else {
      applyPromo(promoCode, true);
    }
  }, [quantity, service, promoCode, user]);

  // Recalculate amountToPay when grandTotal or Wallet changes
  useEffect(() => {
    if (useWallet && user?.walletBalance > 0) {
      const walletApplied = Math.min(grandTotal, user.walletBalance);
      setAmountToPay(grandTotal - walletApplied);
    } else {
      setAmountToPay(grandTotal);
    }
  }, [grandTotal, useWallet, user?.walletBalance]);

  const applyPromo = async (codeToApply, silent = false) => {
    try {
      const baseTotal = service.price * quantity;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        "/api/promo/validate",
        { code: codeToApply, cartTotal: baseTotal },
        config,
      );

      setPromoCode(data.promoCode);
      setDiscount(data.discountAmount);
      setTaxes(data.taxes);
      setPlatformFee(data.platformFee);
      setGrandTotal(data.finalTotal);

      if (!silent)
        toast.success(`Coupon Applied! Saved ₹${data.discountAmount}`);
    } catch (error) {
      if (!silent)
        toast.error(error.response?.data?.message || "Invalid Coupon");
      removePromo();
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim() !== "") {
      applyPromo(couponInput);
      setCouponInput("");
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setDiscount(0);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!date || !timeSlot || !address) {
      toast.error("Please fill in all details");
      return;
    }
    setStep(2);
  };

  const handlePayment = async (bookingId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: order } = await axios.post(
        "/api/payment/create-order",
        { bookingIds: [bookingId], promoCode, useWallet },
        config,
      );

      const options = {
        key: "rzp_test_SMT0KbNTtnsRP8",
        amount: order.amount,
        currency: "INR",
        name: "Urban Clone",
        description: `${service.name} x ${quantity}`,
        order_id: order.id,
        handler: async function (response) {
          await axios.post(
            "/api/payment/verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingIds: [bookingId],
              useWallet,
              promoCode,
            },
            config,
          );

          // Update local state securely
          if (useWallet) {
            const updatedUser = {
              ...user,
              walletBalance:
                user.walletBalance - Math.min(grandTotal, user.walletBalance),
            };
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
          }

          const receiptData = {
            items: [
              { name: service.name, price: service.price, qty: quantity },
            ],
            grandTotal: grandTotal,
            paymentMethod: "online",
            promoCode: promoCode,
            discount: discount,
            taxes: taxes,
            date: date,
            timeSlot: timeSlot,
            address: address,
          };
          resetAndClose();
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

  const handleFinalBooking = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data: booking } = await axios.post(
        "/api/bookings",
        {
          serviceId: service._id,
          date,
          timeSlot,
          address,
          quantity,
          paymentMethod:
            useWallet && amountToPay === 0
              ? "online"
              : paymentMethod !== "cash"
                ? "online"
                : "cash",
          location: coordinates
            ? { type: "Point", coordinates: coordinates }
            : undefined,
        },
        config,
      );

      if (useWallet && amountToPay === 0) {
        // 100% Wallet Bypass!
        await axios.post(
          "/api/payment/wallet-pay",
          { bookingIds: [booking._id], promoCode },
          config,
        );

        const updatedUser = {
          ...user,
          walletBalance: user.walletBalance - grandTotal,
        };
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));

        const receiptData = {
          items: [{ name: service.name, price: service.price, qty: quantity }],
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
        resetAndClose();
        navigate("/order-success", { state: { orderData: receiptData } });
      } else if (paymentMethod === "card" || paymentMethod === "upi") {
        handlePayment(booking._id);
        setLoading(false);
      } else {
        setLoading(false);
        const receiptData = {
          items: [{ name: service.name, price: service.price, qty: quantity }],
          grandTotal: grandTotal,
          paymentMethod: "cash",
          promoCode,
          discount,
          taxes,
          date,
          timeSlot,
          address,
        };
        resetAndClose();
        navigate("/order-success", { state: { orderData: receiptData } });
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Booking failed");
    }
  };

  if (!service) return null;
  const itemTotal = service.price * quantity;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="bottom-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
        >
          <motion.div
            className="bottom-sheet-surface shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-4 pb-2">
              <h5 className="fw-bold mb-0 text-dark">
                {step === 1 ? "Book Service" : "Select Payment"}
              </h5>
              <Button
                variant="link"
                className="text-dark p-0"
                onClick={resetAndClose}
                disabled={loading}
              >
                <FiX size={24} />
              </Button>
            </div>

            <div className="p-4 pt-2">
              <div className="d-flex justify-content-between align-items-center mb-4 bg-light p-3 rounded-4 border">
                <div className="d-flex gap-3 align-items-center">
                  <img
                    src={service.image}
                    alt={service.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h6
                      className="fw-bold mb-1 text-dark"
                      style={{ fontSize: "0.95rem" }}
                    >
                      {service.name}
                    </h6>
                    <span className="fw-bold text-primary">
                      ₹{service.price}
                    </span>
                  </div>
                </div>
                {step === 1 && (
                  <div className="d-flex align-items-center border rounded-pill px-2 bg-white shadow-sm">
                    <Button
                      variant="link"
                      className="text-dark p-1 text-decoration-none"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <FiMinus size={14} />
                    </Button>
                    <span className="fw-bold px-2">{quantity}</span>
                    <Button
                      variant="link"
                      className="text-dark p-1 text-decoration-none"
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      <FiPlus size={14} />
                    </Button>
                  </div>
                )}
              </div>

              {step === 1 && (
                <Form onSubmit={handleNextStep}>
                  <Form.Group className="mb-3">
                    <TimeSlotPicker
                      selectedDate={date}
                      setSelectedDate={setDate}
                      selectedTime={timeSlot}
                      setSelectedTime={setTimeSlot}
                      serviceId={service._id}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <MapPicker
                      setAddress={setAddress}
                      setCoordinates={setCoordinates}
                    />
                    <Form.Control
                      as="textarea"
                      rows={2}
                      className="mt-2 bg-light border-0"
                      placeholder="Complete Address details..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </Form.Group>
                  {/* <Button
                    variant="dark"
                    type="submit"
                    className="w-100 py-3 fw-bold rounded-pill btn-primary-custom shadow-lg"
                  >
                    Proceed to Pay (₹{grandTotal.toFixed(2)})
                  </Button> */}
                  {appConfig.isOperationsPaused ? (
                    <Button
                      variant="danger"
                      className="w-100 py-3 fw-bold rounded-pill shadow-sm opacity-75"
                      disabled
                    >
                      Operations Temporarily Paused
                    </Button>
                  ) : (
                    <Button
                      variant="dark"
                      type="submit"
                      className="w-100 py-3 fw-bold rounded-pill btn-primary-custom shadow-lg"
                    >
                      Proceed to Pay (₹{grandTotal.toFixed(2)})
                    </Button>
                  )}
                </Form>
              )}

              {step === 2 && (
                <div>
                  {/* PROMO BOX */}
                  <div className="mb-4 pb-4 border-bottom">
                    <h6 className="fw-bold mb-3">
                      <FiTag className="me-2" /> Coupons and Offers
                    </h6>
                    {promoCode ? (
                      <div className="d-flex justify-content-between align-items-center bg-success bg-opacity-10 text-success p-3 rounded-4 border border-success">
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
                        <InputGroup className="shadow-sm rounded-pill overflow-hidden">
                          <Form.Control
                            placeholder="Enter Coupon Code"
                            value={couponInput}
                            onChange={(e) =>
                              setCouponInput(e.target.value.toUpperCase())
                            }
                            className="bg-light border-0 px-4"
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

                  {/* INVOICE MATH */}
                  <div className="mb-3 p-3 bg-light rounded-4 border">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">
                        Item Total ({quantity}x)
                      </span>
                      <span className="fw-bold small">
                        ₹{itemTotal.toFixed(2)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="d-flex justify-content-between mb-1 text-success">
                        <span className="small">Discount</span>
                        <span className="fw-bold small">
                          - ₹{discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Taxes (18% GST)</span>
                      <span className="fw-bold small">₹{taxes.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Platform Fee</span>
                      <span className="fw-bold small">
                        ₹{platformFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-top pt-2 mt-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark">Grand Total</span>
                        <span className="fw-bold text-dark">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>

                      {useWallet && (
                        <div className="d-flex justify-content-between align-items-center mt-2 text-success">
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
                    </div>
                  </div>

                  {/* 🌟 WALLET CHECKBOX 🌟 */}
                  {user?.walletBalance > 0 && (
                    <div
                      className={`p-3 mb-3 border rounded-3 transition-all ${useWallet ? "border-success bg-success bg-opacity-10 shadow-sm" : "bg-white"}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <Form.Check
                          type="checkbox"
                          id="modal-wallet-check"
                          label={
                            <span className="fw-bold ms-1 text-dark">
                              Use Urban Wallet
                            </span>
                          }
                          checked={useWallet}
                          onChange={(e) => {
                            setUseWallet(e.target.checked);
                            if (e.target.checked && paymentMethod === "cash")
                              setPaymentMethod("upi");
                          }}
                          className="mb-0 custom-switch-premium"
                        />
                        {useWallet && (
                          <span className="fw-bold text-success">
                            - ₹
                            {Math.min(grandTotal, user.walletBalance).toFixed(
                              2,
                            )}
                          </span>
                        )}
                      </div>
                      <small className="text-muted ms-4 ps-2 d-block mt-1">
                        Available: ₹{user.walletBalance.toFixed(2)}
                      </small>
                    </div>
                  )}

                  {/* STANDARD PAYMENT METHODS */}
                  {amountToPay > 0 && (
                    <div className="d-grid gap-3 mb-4">
                      <div
                        className={`p-3 border rounded-4 cursor-pointer d-flex align-items-center justify-content-between ${paymentMethod === "upi" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"}`}
                        onClick={() => setPaymentMethod("upi")}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-white p-2 rounded-circle shadow-sm">
                            <FiSmartphone size={20} className="text-success" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">UPI / GPay</h6>
                            <small className="text-muted">
                              Instant payment
                            </small>
                          </div>
                        </div>
                        {paymentMethod === "upi" && (
                          <FiCheckCircle className="text-primary fs-5" />
                        )}
                      </div>

                      <div
                        className={`p-3 border rounded-4 cursor-pointer d-flex align-items-center justify-content-between ${useWallet ? "opacity-50 bg-light" : paymentMethod === "cash" ? "border-primary bg-primary bg-opacity-10 shadow-sm" : "bg-white"}`}
                        onClick={() => !useWallet && setPaymentMethod("cash")}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-white p-2 rounded-circle shadow-sm">
                            <FiDollarSign size={20} className="text-warning" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">Pay After Service</h6>
                            <small className="text-muted">
                              {useWallet
                                ? "Not available with Wallet"
                                : "Cash on completion"}
                            </small>
                          </div>
                        </div>
                        {paymentMethod === "cash" && !useWallet && (
                          <FiCheckCircle className="text-primary fs-5" />
                        )}
                      </div>
                    </div>
                  )}

                  <Row className="g-2 mt-2">
                    <Col xs={4}>
                      <Button
                        variant="light"
                        className="w-100 fw-bold border rounded-pill py-3"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        <FiChevronLeft /> Back
                      </Button>
                    </Col>
                    <Col xs={8}>
                      <Button
                        variant="dark"
                        className="w-100 fw-bold rounded-pill btn-primary-custom py-3 shadow-lg"
                        onClick={handleFinalBooking}
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
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
