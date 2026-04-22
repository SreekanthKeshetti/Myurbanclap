const express = require("express");
const router = express.Router();
const {
  validatePromoCode,
  getAllPromos,
  createPromo,
  togglePromoStatus,
  deletePromo,
} = require("../controllers/promoController");
const { protect } = require("../middleware/authMiddleware");

// Customer Route
router.post("/validate", protect, validatePromoCode);

// Admin Routes
router.get("/admin/all", protect, getAllPromos);
router.post("/admin/create", protect, createPromo);
router.put("/admin/:id/toggle", protect, togglePromoStatus);
router.delete("/admin/:id", protect, deletePromo);

module.exports = router;
