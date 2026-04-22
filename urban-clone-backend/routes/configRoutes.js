const express = require("express");
const router = express.Router();
const { getConfig, updateConfig } = require("../controllers/configController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getConfig); // Publicly accessible by frontend
router.put("/", protect, admin, updateConfig); // Restricted to Admin

module.exports = router;
