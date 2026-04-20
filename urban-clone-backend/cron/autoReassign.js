const cron = require("node-cron");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// We pass the 'io' instance here so the cron job can send real-time socket alerts
const initCronJobs = (io) => {
  // This cron expression "* * * * *" means: RUN EVERY 1 MINUTE
  cron.schedule("* * * * *", async () => {
    try {
      // 1. Calculate the time threshold.
      // Standard: 15 minutes ago.
      // 🚨 PRO-TIP FOR TESTING: Change the 15 to 1 to test it in 1 minute!
      const thresholdTime = new Date(Date.now() - 15 * 60 * 1000);

      // 2. Find bookings stuck in "accepted" status where the last update was BEFORE the threshold
      const stuckBookings = await Booking.find({
        status: "accepted",
        updatedAt: { $lt: thresholdTime },
      });

      if (stuckBookings.length > 0) {
        console.log(
          `[CRON] Found ${stuckBookings.length} unresponsive provider(s). Reassigning...`,
        );
      }

      // 3. Process each stuck booking
      for (const booking of stuckBookings) {
        const providerId = booking.provider;

        // A. Revert booking to "pending" and remove provider link so others can see it
        booking.status = "pending";
        booking.provider = undefined;
        await booking.save();

        if (providerId) {
          // B. Penalize the lazy Provider (₹50)
          const provider = await User.findById(providerId);
          if (provider) {
            provider.walletBalance = (provider.walletBalance || 0) - 50;
            await provider.save();

            // Create negative transaction for the provider
            await Transaction.create({
              user: provider._id,
              booking: booking._id,
              amount: -50,
              type: "debit",
              description: `Auto-Penalty: Failed to start Job #${booking._id.toString().slice(-4)} on time.`,
            });

            // Fire Socket Event to alert the provider
            io.to(provider._id.toString()).emit("booking_update", {
              title: "Job Reassigned ⚠️",
              message: `Job #${booking._id.toString().slice(-4)} was removed due to inactivity. ₹50 penalty applied.`,
              createdAt: new Date().toISOString(),
            });
          }

          // C. Credit Admin Wallet with the Penalty (Because we own the platform!)
          const admin = await User.findOne({ role: "admin" });
          if (admin) {
            admin.walletBalance = (admin.walletBalance || 0) + 50;
            await admin.save();

            await Transaction.create({
              user: admin._id,
              booking: booking._id,
              amount: 50,
              type: "credit",
              description: `Provider Auto-Drop Penalty from Job #${booking._id.toString().slice(-4)}`,
            });
          }
        }

        // D. Notify the Customer via Socket.io
        io.to(booking.user.toString()).emit("booking_update", {
          title: "Update on your booking 🔄",
          message:
            "Your assigned professional was delayed. We are searching for a new professional nearby! 🔄",
          bookingId: booking._id,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("[CRON ERROR] Auto-Reassign Failed:", error);
    }
  });

  console.log("⏱️  Cron Jobs Initialized: Auto-Reassignment Engine Active.");
};

module.exports = initCronJobs;
