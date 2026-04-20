const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, unique: true, required: true },
  location: { type: String },
  // --- NEW GEO-LOCATION FIELD (For Providers) ---
  geoLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }, // [Longitude, Latitude]
  },
  // ----------------------------------------------
  role: {
    type: String,
    enum: ["customer", "provider", "admin"],
    default: "customer",
  },
  // --- 🌟 NEW: PLUS MEMBERSHIP FIELDS ---
  isPlusMember: { type: Boolean, default: false },
  plusMembershipExpiry: { type: Date },
  // --------------------------------------

  // Specific to Providers
  providerDetails: {
    // --- 🌟 NEW: DYNAMIC TAXONOMY LINKS ---
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    // --------------------------------------
    experience: { type: Number },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "pending",
    },
    documentImage: { type: String },
    // --- NEW: PROVIDER RATING FIELDS ---
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    // -----------------------------------
  },

  walletBalance: { type: Number, default: 0 }, // Can be negative (Debt)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
