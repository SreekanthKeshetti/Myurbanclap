const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Can be the Customer OR the Admin
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false, // Helps UI align messages easily (Left vs Right)
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
