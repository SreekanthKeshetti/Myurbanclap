const mongoose = require("mongoose");

const payoutRequestSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    upiId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "rejected"],
      default: "pending",
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PayoutRequest", payoutRequestSchema);
