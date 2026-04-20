const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserProfile,
  sendOtp,
  verifyOtp,
  uploadKYC,
  verifyProvider,
  getPendingProviders,
  getAllUsers,
  getUserWallet,
} = require("../controllers/authController");
const { protect, admin, provider } = require("../middleware/authMiddleware"); // We need protection
// 🌟 NEW: Import our Strict Bouncer
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", registerUser);
router.put("/profile", protect, updateUserProfile);
router.post("/login", authLimiter, loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
// Wallet Route
router.get("/my-wallet", protect, getUserWallet);
// KYC Routes
router.post("/upload-kyc", protect, provider, uploadKYC);
router.put("/admin/verify-provider", protect, admin, verifyProvider);
router.get("/admin/pending-providers", protect, admin, getPendingProviders);
router.get("/admin/users", protect, admin, getAllUsers);
module.exports = router;
