const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with your .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up the Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "urban_clone", // Cloudinary will create this folder for you
    allowedFormats: ["jpg", "png", "jpeg", "webp", "pdf"], // Security: only allow images/pdfs
  },
});

// Create the Multer upload middleware
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
