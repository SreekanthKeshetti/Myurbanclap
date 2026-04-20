const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The Provider
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  amount: { type: Number, required: true }, // e.g., 800 or -200
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  description: { type: String, required: true }, // e.g. "Earnings from Booking #123"
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
