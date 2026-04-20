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

module.exports = { validatePromoCode };
