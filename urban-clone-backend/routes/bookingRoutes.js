const express = require("express");
const router = express.Router();
const {
  createBooking,
  createBulkBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  getAvailableJobs,
  acceptJob,
  getProviderHistory,
  completeJob,
  updateJobStatus,
  verifyStartOtp,
  getProviderWallet,
  checkAvailability,
  cancelBooking,
  getAnalytics,
  rescheduleBooking,
  logDailyDelivery,
} = require("../controllers/bookingController");
const { protect, admin, provider } = require("../middleware/authMiddleware");

// Both routes need you to be logged in (protect)
// Customer Routes
router.post("/", protect, createBooking);
router.get("/mybookings", protect, getMyBookings);
router.post("/bulk", protect, createBulkBooking);
router.put("/:id/reschedule", protect, rescheduleBooking); // <--- ADD THIS LINE
// Admin Routes (Now 'admin' is defined, so this won't crash)
router.get("/admin/all", protect, admin, getAllBookings);
router.get("/admin/analytics", protect, admin, getAnalytics);

router.put("/:id", protect, admin, updateBookingStatus);
// --- Provider Routes ---
router.get("/provider/available", protect, provider, getAvailableJobs);
router.get("/provider/myjobs", protect, provider, getProviderHistory);
router.get("/provider/wallet", protect, provider, getProviderWallet);
router.put("/:id/accept", protect, provider, acceptJob);
router.put("/:id/complete", protect, provider, completeJob);
router.put("/:id/status", protect, provider, updateJobStatus);
router.put("/:id/cancel", protect, cancelBooking);
router.post("/:id/verify-start-otp", protect, provider, verifyStartOtp);
// Add this line under your other Provider Routes
router.put("/:id/log-delivery", protect, provider, logDailyDelivery);
// Public or Protected Route (Public is fine for checking slots)
router.post("/check-availability", checkAvailability);

module.exports = router;
