const express = require("express");
const router = express.Router();
const {
  createReview,
  getServiceReviews,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createReview); // Add review (Needs Login)
router.get("/:serviceId", getServiceReviews); // Read reviews (Public)

module.exports = router;
