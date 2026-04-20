const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Booking = require("./models/Booking");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const createIndexes = async () => {
  try {
    console.log("⏳ Creating GeoSpatial Indexes...");

    // Create Index for Bookings
    await Booking.collection.createIndex({ location: "2dsphere" });
    console.log("✅ Booking Index Created");

    // Create Index for Users
    await User.collection.createIndex({ geoLocation: "2dsphere" });
    console.log("✅ User Index Created");

    process.exit();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createIndexes();
