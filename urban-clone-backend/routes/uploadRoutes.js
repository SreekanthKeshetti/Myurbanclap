const express = require("express");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary and get the URL back
// We use 'upload.single("image")' which tells Multer to look for a file named "image" in the request
router.post("/", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // req.file.path is automatically created by Cloudinary and contains the live URL!
    res.json({
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Image upload failed", error: error.message });
  }
});

module.exports = router;
