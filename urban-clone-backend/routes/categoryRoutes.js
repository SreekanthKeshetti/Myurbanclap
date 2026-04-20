const express = require("express");
const router = express.Router();
const {
  getCatalogTree,
  createCategory,
  createSubCategory,
} = require("../controllers/categoryController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public can view the tree
router.get("/tree", getCatalogTree);

// Only Admin can add categories
router.post("/", protect, admin, createCategory);
router.post("/sub", protect, admin, createSubCategory);

module.exports = router;
