const PromoCode = require("../models/PromoCode");

// @desc    Validate Promo Code and Calculate Totals
// @route   POST /api/promo/validate
// @access  Private (or Public, but usually private so only logged-in users use it)
const validatePromoCode = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    // 1. Initial Math (Before Discount)
    let discountAmount = 0;

    // 2. Find and Validate the Code
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    if (!promo.isActive) {
      return res.status(400).json({ message: "This promo code is inactive" });
    }

    if (new Date() > new Date(promo.expiryDate)) {
      return res.status(400).json({ message: "This promo code has expired" });
    }

    if (cartTotal < promo.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value of ₹${promo.minOrderValue} required`,
      });
    }

    // 3. Calculate Discount
    if (promo.discountType === "flat") {
      discountAmount = promo.discountValue;
    } else if (promo.discountType === "percentage") {
      discountAmount = (cartTotal * promo.discountValue) / 100;
      // Cap it at max discount if provided
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    }

    // Ensure discount doesn't exceed cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    // 4. Calculate Final Numbers (GST is calculated ON the discounted subtotal)
    const discountedSubtotal = cartTotal - discountAmount;

    // Urban Company Standard: 18% total GST (9% CGST + 9% SGST)
    const totalGst = Number((discountedSubtotal * 0.18).toFixed(2));

    // Minor platform fee (optional, keeping it low for realism)
    const platformFee = 29;

    const finalTotal = discountedSubtotal + totalGst + platformFee;

    res.json({
      message: "Promo code applied successfully",
      discountAmount: Number(discountAmount.toFixed(2)),
      discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
      taxes: totalGst,
      platformFee,
      finalTotal: Number(finalTotal.toFixed(2)),
      promoCode: promo.code,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ==========================================
// 🌟 NEW ADMIN CONTROLLERS 🌟
// ==========================================

// @desc    Get all Promo Codes
// @route   GET /api/promo/admin/all
const getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find({}).sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new Promo Code
// @route   POST /api/promo/admin/create
const createPromo = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderValue,
      expiryDate,
    } = req.body;

    const promoExists = await PromoCode.findOne({ code: code.toUpperCase() });
    if (promoExists)
      return res.status(400).json({ message: "Promo code already exists" });

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      expiryDate: new Date(expiryDate),
    });

    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Active/Inactive status
// @route   PUT /api/promo/admin/:id/toggle
const togglePromoStatus = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promo not found" });

    promo.isActive = !promo.isActive;
    await promo.save();
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Promo Code
// @route   DELETE /api/promo/admin/:id
const deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promo not found" });

    await promo.deleteOne();
    res.json({ message: "Promo code deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validatePromoCode,
  getAllPromos,
  createPromo,
  togglePromoStatus,
  deletePromo,
};
