const mongoose = require("mongoose");

const appConfigSchema = new mongoose.Schema(
  {
    isOperationsPaused: { type: Boolean, default: false },
    emergencyMessage: {
      type: String,
      default: "Operations are temporarily paused. We will be back shortly.",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AppConfig", appConfigSchema);
