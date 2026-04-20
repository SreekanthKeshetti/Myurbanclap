const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  payWithWallet,
  createMembershipOrder,
  verifyMembershipPayment,
  razorpayWebhook,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
// Standard Bookings
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);
router.post("/wallet-pay", protect, payWithWallet);
// Membership
router.post("/membership/create-order", protect, createMembershipOrder);
router.post("/membership/verify", protect, verifyMembershipPayment);

module.exports = router;
