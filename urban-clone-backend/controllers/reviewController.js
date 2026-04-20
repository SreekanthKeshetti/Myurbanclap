const Review = require("../models/Review");
const Service = require("../models/Service");
const User = require("../models/User");
const Booking = require("../models/Booking");

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to review this booking" });
    }
    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ message: "You can only review completed services" });
    }

    const alreadyReviewed = await Review.findOne({ booking: bookingId });
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this service" });
    }

    // 1. Create Review
    await Review.create({
      user: req.user.id,
      provider: booking.provider,
      service: booking.service,
      booking: bookingId,
      rating: Number(rating),
      comment,
    });

    // ==========================================
    // 2. NEW: UPDATE THE BOOKING STATUS
    // ==========================================
    booking.isReviewed = true;
    booking.ratingGiven = Number(rating);
    await booking.save();
    // ==========================================

    // 3. UPDATE SERVICE AVERAGE RATING
    const serviceReviews = await Review.find({ service: booking.service });
    const service = await Service.findById(booking.service);
    service.numReviews = serviceReviews.length;
    service.rating =
      serviceReviews.reduce((acc, item) => item.rating + acc, 0) /
      serviceReviews.length;
    await service.save();

    // 4. UPDATE PROVIDER AVERAGE RATING
    const providerReviews = await Review.find({ provider: booking.provider });
    const provider = await User.findById(booking.provider);
    provider.providerDetails.numReviews = providerReviews.length;
    provider.providerDetails.rating =
      providerReviews.reduce((acc, item) => item.rating + acc, 0) /
      providerReviews.length;
    await provider.save();

    res.status(201).json({ message: "Review added successfully!" });
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a specific service
// @route   GET /api/reviews/:serviceId
// @access  Public
const getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      service: req.params.serviceId,
    }).populate("user", "name");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getServiceReviews };
