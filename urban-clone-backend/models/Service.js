const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a service name"], // e.g., "Deep Home Cleaning"
    },

    // --- 🌟 THE NEW ARCHITECTURE UPGRADE ---
    // Instead of a string, we link it to the actual SubCategory and Category!
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    // ---------------------------------------

    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    video: {
      type: String,
      default: "",
    },

    // 🌟 SUBSCRIPTION ENGINE PREP (For Tiffins, Milk, etc.)
    bookingType: {
      type: String,
      enum: ["one-time", "subscription"],
      default: "one-time",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    features: [String],
    excludes: [String],
    searchTags: [String], // NEW: For better search and filtering (e.g., ["home", "cleaning", "deep"])
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Service", serviceSchema);
