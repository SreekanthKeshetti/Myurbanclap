// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const multer = require("multer");

// // Configure Cloudinary with your .env credentials
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Set up the Storage Engine
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "urban_clone", // Cloudinary will create this folder for you
//     allowedFormats: ["jpg", "png", "jpeg", "webp", "pdf"], // Security: only allow images/pdfs
//   },
// });

// // Create the Multer upload middleware
// const upload = multer({ storage: storage });

// module.exports = { upload, cloudinary };

// HERE WE ARE UPLOADING THE IMAGES INTO FOLDER WITH THIS BELOW CODE
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with your .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up the Storage Engine dynamically
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 1. Fallback folder
    let folderName = "urban_clone/general";

    // 2. 🌟 BUG FIX: Use _id instead of id to perfectly match MongoDB
    if (req.user && req.user._id) {
      if (req.user.role === "admin") {
        folderName = `urban_clone/admin_assets/services`;
      } else {
        // Now it will correctly grab the Mongo ObjectId!
        folderName = `urban_clone/users/${req.user._id}/uploads`;
      }
    }

    return {
      folder: folderName,
      allowedFormats: ["jpg", "png", "jpeg", "webp", "pdf"],
      public_id: `${file.fieldname}_${Date.now()}`,
    };
  },
});

// Create the Multer upload middleware
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
