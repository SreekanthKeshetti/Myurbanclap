// const mongoose = require("mongoose");

// const bookingSchema = mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User", // Links to the User model
//       required: true,
//     },
//     service: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Service", // Links to the Service model
//       required: true,
//     },

//     provider: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       // No 'required: true' yet, because it's assigned later
//     },
//     quantity: { type: Number, default: 1 },
//     totalPrice: { type: Number }, // To store the final price paid
//     date: {
//       type: String, // You can use Date type, but String is easier for beginners (e.g., "2023-10-25")
//       required: true,
//     },
//     timeSlot: {
//       type: String,
//       required: true,
//       default: "10:00 AM", // Fallback
//     },
//     address: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "accepted", "confirmed", "completed", "cancelled"],
//       default: "pending",
//     },
//     // --- NEW COMMERCE FIELDS ---
//     paymentMethod: {
//       type: String,
//       enum: ["upi", "card", "cash", "online"],
//       default: "cash",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["paid", "pending"], // 'paid' for UPI/Card, 'pending' for Cash
//       default: "pending",
//     },
//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "accepted",
//         "ontheway",
//         "arrived",
//         "inprogress",
//         "completed",
//         "cancelled",
//       ],
//       default: "pending",
//     },
//     startJobOtp: { type: String },
//     endJobOtp: { type: String },
//     startJobSelfie: { type: String },
//     // --- NEW: REVIEW TRACKING ---
//     isReviewed: { type: Boolean, default: false },
//     ratingGiven: { type: Number },
//     // ----------------------------
//     // --- NEW GEO-LOCATION FIELD ---
//     location: {
//       type: { type: String, enum: ["Point"] },
//       coordinates: { type: [Number], index: "2dsphere" }, // [Longitude, Latitude]
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// module.exports = mongoose.model("Booking", bookingSchema);
const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    quantity: { type: Number, default: 1 },
    totalPrice: { type: Number },

    // --- 🌟 NEW: SUBSCRIPTION ENGINE SUPPORT ---
    bookingType: {
      type: String,
      enum: ["one-time", "subscription"],
      default: "one-time",
    },
    subscriptionDetails: {
      startDate: { type: String }, // e.g., "2026-04-15"
      endDate: { type: String }, // e.g., "2026-05-15"
      totalDeliveries: { type: Number, default: 30 }, // Default 1 month
      deliveriesCompleted: { type: Number, default: 0 },
    },
    // -------------------------------------------

    date: {
      type: String, // Kept for backwards compatibility with one-time bookings
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      default: "10:00 AM",
    },
    address: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cash", "online"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "ontheway",
        "arrived",
        "inprogress",
        "completed",
        "cancelled",
        "active_subscription", // 🌟 NEW STATUS FOR RECURRING JOBS
      ],
      default: "pending",
    },
    startJobOtp: { type: String },
    endJobOtp: { type: String },
    startJobSelfie: { type: String },

    isReviewed: { type: Boolean, default: false },
    ratingGiven: { type: Number },

    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], index: "2dsphere" },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
