const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // e.g., 'WELCOME50'
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"], // Is it 20% off or flat ₹50 off?
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscountAmount: {
      type: Number, // Useful for percentage: "20% off UP TO ₹100"
      default: null,
    },
    minOrderValue: {
      type: Number, // Only valid if cart is > ₹499
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);
