const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // e.g., "Home Trades", "Pet Services", "Daily Convenience"
    },
    description: {
      type: String,
    },
    icon: {
      type: String, // We can store a URL or a React-Icon name string here
      default: "FiGrid",
    },
    image: {
      type: String, // Background image for beautiful UI cards
      default: "https://via.placeholder.com/300",
    },
    color: {
      type: String, // e.g., "#FDF2F8" for UI styling
      default: "#f8fafc",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", categorySchema);
