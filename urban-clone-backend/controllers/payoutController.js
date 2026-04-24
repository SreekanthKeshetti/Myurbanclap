const PayoutRequest = require("../models/PayoutRequest");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// @desc    Provider requests a payout
// @route   POST /api/payouts/request
// @access  Private/Provider
const requestPayout = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const providerId = req.user.id;

    if (!amount || !upiId) {
      return res
        .status(400)
        .json({ message: "Amount and UPI ID are required" });
    }

    if (amount < 500) {
      return res
        .status(400)
        .json({ message: "Minimum payout request is ₹500" });
    }

    const provider = await User.findById(providerId);

    if (provider.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // 1. Deduct balance instantly to prevent double-withdrawals
    provider.walletBalance -= amount;
    await provider.save();

    // 2. Create ledger entry
    await Transaction.create({
      user: provider._id,
      amount: -amount,
      type: "debit",
      description: `Requested Payout to UPI: ${upiId}`,
    });

    // 3. Create Request Document
    const payoutRequest = await PayoutRequest.create({
      provider: provider._id,
      amount,
      upiId,
    });

    res
      .status(201)
      .json({ message: "Payout requested successfully", payoutRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payout requests (Admin)
// @route   GET /api/payouts/admin/all
// @access  Private/Admin
const getAllPayouts = async (req, res) => {
  try {
    const payouts = await PayoutRequest.find({})
      .populate("provider", "name phone email")
      .sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process a payout (Admin)
// @route   PUT /api/payouts/admin/:id/process
// @access  Private/Admin
const processPayout = async (req, res) => {
  try {
    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return res.status(404).json({ message: "Payout not found" });

    payout.status = "processed";
    payout.processedAt = Date.now();
    await payout.save();

    // Real-time notification to the provider
    if (req.io) {
      req.io.to(payout.provider.toString()).emit("booking_update", {
        title: "Payout Processed! 💸",
        message: `Your payout of ₹${payout.amount} has been successfully transferred to ${payout.upiId}.`,
      });
    }

    res.json({ message: "Payout marked as processed", payout });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get logged-in provider's payout requests
// @route   GET /api/payouts/my-payouts
// @access  Private/Provider
const getMyPayouts = async (req, res) => {
  try {
    const payouts = await PayoutRequest.find({ provider: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestPayout, getAllPayouts, processPayout, getMyPayouts };
