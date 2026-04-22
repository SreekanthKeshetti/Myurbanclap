const express = require("express");
const router = express.Router();
const {
  requestPayout,
  getAllPayouts,
  processPayout,
} = require("../controllers/payoutController");
const { protect, provider, admin } = require("../middleware/authMiddleware");

// Provider Routes
router.post("/request", protect, provider, requestPayout);

// Admin Routes
router.get("/admin/all", protect, admin, getAllPayouts);
router.put("/admin/:id/process", protect, admin, processPayout);

module.exports = router;
