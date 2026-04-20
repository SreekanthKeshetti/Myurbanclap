const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const PromoCode = require("../models/PromoCode");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------------------------------------------------------
// 🌟 SENIOR DEV PATTERN: HELPER FUNCTION
// This holds YOUR exact math, so we don't copy/paste it 3 times!
// ------------------------------------------------------------------
const calculateOrderTotal = async (bookingIds, promoCode, userId) => {
  const bookings = await Booking.find({
    _id: { $in: bookingIds },
    user: userId,
  });
  if (bookings.length !== bookingIds.length)
    throw new Error("Invalid booking IDs");

  const baseTotal = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  let discountAmount = 0;

  // YOUR EXACT PROMO CODE LOGIC
  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase(),
      isActive: true,
    });
    if (
      promo &&
      new Date() <= new Date(promo.expiryDate) &&
      baseTotal >= promo.minOrderValue
    ) {
      if (promo.discountType === "flat") {
        discountAmount = promo.discountValue;
      } else if (promo.discountType === "percentage") {
        discountAmount = (baseTotal * promo.discountValue) / 100;
        if (
          promo.maxDiscountAmount &&
          discountAmount > promo.maxDiscountAmount
        ) {
          discountAmount = promo.maxDiscountAmount;
        }
      }
      if (discountAmount > baseTotal) discountAmount = baseTotal; // Prevent negative
    }
  }

  // YOUR EXACT TAX & FEE LOGIC
  const discountedSubtotal = baseTotal - discountAmount;
  const taxes = Number((discountedSubtotal * 0.18).toFixed(2));
  // const platformFee = 29;
  // --- 🌟 NEW: PLATFORM FEE WAIVER FOR PLUS MEMBERS ---
  const userDb = await User.findById(userId);
  const hasActivePlus =
    userDb.isPlusMember &&
    userDb.plusMembershipExpiry &&
    new Date() < new Date(userDb.plusMembershipExpiry);
  const platformFee = hasActivePlus ? 0 : 29;
  // ----------------------------------------------------

  const finalAmount = discountedSubtotal + taxes + platformFee;

  // We return the math results AND the user database document
  // const userDb = await User.findById(userId);
  return { finalAmount, userDb };
};

// @desc    Create Razorpay Order Securely
// @route   POST /api/payment/create-order
const createOrder = async (req, res) => {
  try {
    const { bookingIds, promoCode, useWallet } = req.body;

    if (!bookingIds || bookingIds.length === 0) {
      return res.status(400).json({ message: "No bookings provided" });
    }

    // 1. Run the Math
    let { finalAmount, userDb } = await calculateOrderTotal(
      bookingIds,
      promoCode,
      req.user.id,
    );

    // 2. 🌟 NEW: WALLET DEDUCTION LOGIC 🌟
    let walletApplied = 0;
    if (useWallet && userDb.walletBalance > 0) {
      walletApplied = Math.min(finalAmount, userDb.walletBalance);
      finalAmount -= walletApplied; // Subtract wallet from the amount to pay
    }

    // 3. If Wallet covers 100% of the cost, skip Razorpay!
    if (finalAmount <= 0) {
      return res.json({ fullyPaidByWallet: true, secureCalculatedAmount: 0 });
    }

    // 4. Create Razorpay Order for the REMAINING balance
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      // sp5 webhook 🌟 NEW: We pass the data to Razorpay so they can hand it back to our Webhook later!
      notes: {
        userId: req.user.id.toString(),
        bookingIds: JSON.stringify(bookingIds),
        useWallet: useWallet ? "true" : "false",
        promoCode: promoCode || "",
      },
    };

    const order = await razorpay.orders.create(options);
    res.json({ ...order, secureCalculatedAmount: finalAmount });
  } catch (error) {
    console.error("Payment Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Payment Signature & Deduct Wallet
// @route   POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingIds,
      useWallet,
      promoCode,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // 1. 🌟 NEW: DEDUCT WALLET ONLY AFTER SUCCESSFUL PAYMENT 🌟
      let { finalAmount, userDb } = await calculateOrderTotal(
        bookingIds,
        promoCode,
        req.user.id,
      );

      if (useWallet && userDb.walletBalance > 0) {
        const walletApplied = Math.min(finalAmount, userDb.walletBalance);
        userDb.walletBalance -= walletApplied;
        await userDb.save();

        await Transaction.create({
          user: userDb._id,
          booking: bookingIds[0], // Link to first booking in cart
          amount: -walletApplied,
          type: "debit",
          description: `Used Wallet Balance for Online Order`,
        });
      }

      // 2. Update Bookings (Your existing logic)
      if (bookingIds && bookingIds.length > 0) {
        await Booking.updateMany(
          { _id: { $in: bookingIds } },
          { paymentStatus: "paid", paymentMethod: "online" },
        );
      }

      res.json({ success: true, message: "Payment Verified" });
    } else {
      res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    100% Wallet Payment (Bypass Razorpay)
// @route   POST /api/payment/wallet-pay
const payWithWallet = async (req, res) => {
  try {
    const { bookingIds, promoCode } = req.body;
    let { finalAmount, userDb } = await calculateOrderTotal(
      bookingIds,
      promoCode,
      req.user.id,
    );

    // Double check they actually have enough money
    if (userDb.walletBalance >= finalAmount) {
      // 1. Deduct Money
      userDb.walletBalance -= finalAmount;
      await userDb.save();

      // 2. Create Ledger Record
      await Transaction.create({
        user: userDb._id,
        booking: bookingIds[0],
        amount: -finalAmount,
        type: "debit",
        description: `Paid 100% using Wallet Balance`,
      });

      // 3. Mark Jobs as Paid
      await Booking.updateMany(
        { _id: { $in: bookingIds } },
        { paymentStatus: "paid", paymentMethod: "online" }, // Technically "online" because they pre-paid
      );

      res.json({ success: true, message: "Paid successfully using Wallet!" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Insufficient Wallet Balance" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ==========================================================
// 🌟 NEW: SUBSCRIPTION MEMBERSHIP APIS
// ==========================================================
const createMembershipOrder = async (req, res) => {
  try {
    const membershipPrice = 299; // ₹299 for 6 months
    const options = {
      amount: membershipPrice * 100, // Paisa
      currency: "INR",
      receipt: "plus_" + Math.random().toString(36).substring(7),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyMembershipPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const user = await User.findById(req.user.id);

      // Add 6 months to expiry
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);

      user.isPlusMember = true;
      user.plusMembershipExpiry = expiryDate;
      await user.save();

      res.json({
        success: true,
        message: "Welcome to Plus!",
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isPlusMember: user.isPlusMember,
          plusMembershipExpiry: user.plusMembershipExpiry,
          walletBalance: user.walletBalance,
          token: req.headers.authorization.split(" ")[1],
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Razorpay Server-to-Server Webhook
// @route   POST /api/payment/webhook
// @access  Public (But cryptographically secured)
const razorpayWebhook = async (req, res) => {
  try {
    // 1. Razorpay sends the secret signature in the headers
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // We will add this to .env

    // 2. We cryptographically verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("🚨 Webhook signature mismatch! Hacker attack prevented.");
      return res.status(400).json({ message: "Invalid signature" });
    }

    // 3. If valid, check what event happened
    const event = req.body.event;

    if (event === "payment.captured" || event === "payment.authorized") {
      const paymentEntity = req.body.payload.payment.entity;

      // Extract the notes we safely attached in Step 1
      const notes = paymentEntity.notes;
      if (!notes || !notes.bookingIds) {
        return res.status(200).send("No notes found, ignoring.");
      }

      const bookingIds = JSON.parse(notes.bookingIds);
      const userId = notes.userId;
      const useWallet = notes.useWallet === "true";
      const promoCode = notes.promoCode;

      // 4. Check if these bookings are ALREADY paid (Idempotency Check)
      // This prevents double-deducting the wallet if the frontend AND the webhook both hit the server
      const existingBooking = await Booking.findById(bookingIds[0]);
      if (existingBooking.paymentStatus === "paid") {
        return res.status(200).send("Already processed. Ignoring.");
      }

      // 5. Run the EXACT same Math & Wallet deduction logic from your `verifyPayment` function
      let { finalAmount, userDb } = await calculateOrderTotal(
        bookingIds,
        promoCode,
        userId,
      );

      if (useWallet && userDb.walletBalance > 0) {
        const walletApplied = Math.min(finalAmount, userDb.walletBalance);
        userDb.walletBalance -= walletApplied;
        await userDb.save();

        await Transaction.create({
          user: userDb._id,
          booking: bookingIds[0],
          amount: -walletApplied,
          type: "debit",
          description: `Used Wallet Balance for Online Order (Webhook Verified)`,
        });
      }

      // 6. Update the Bookings to 'paid'
      await Booking.updateMany(
        { _id: { $in: bookingIds } },
        { paymentStatus: "paid", paymentMethod: "online" },
      );

      console.log(
        `✅ Webhook Processed! Bookings [${bookingIds}] marked as PAID.`,
      );
    }

    // 7. Always return 200 OK so Razorpay knows we got the message
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook processing failed");
  }
};

// Exporting all functions
module.exports = {
  createOrder,
  verifyPayment,
  payWithWallet,
  createMembershipOrder,
  verifyMembershipPayment,
  razorpayWebhook,
};
