const express = require("express");
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware"); // Import the gatekeeper

// Anyone can GET services
router.get("/", getServices);
router.get("/:id", getServiceById);

// Only logged in users (protect) can POST services
router.post("/", protect, createService);

module.exports = router;
