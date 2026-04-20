const Service = require("../models/Service");

// @desc    Get all services (Search & Filter)
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { keyword, categoryId } = req.query;
    let query = {};

    // 1. 🌟 ADVANCED SEARCH: Look in Name OR hidden Search Tags
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { searchTags: { $regex: keyword, $options: "i" } }, // <--- The Magic!
      ];
    }

    // 2. Safe Category Filter using ObjectId
    if (categoryId && categoryId !== "All") {
      query.category = categoryId;
    }

    const services = await Service.find(query)
      .populate("category", "name icon color")
      .populate("subCategory", "name");

    res.json(services);
  } catch (error) {
    console.error("Service Search Error:", error);
    res.status(500).json({ message: "Error fetching services" });
  }
};

// @desc    Get single service details
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: "Service not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Only logged in users)
const createService = async (req, res) => {
  try {
    const { name, category, description, price, features, excludes, image } =
      req.body;

    const service = await Service.create({
      name,
      category,
      description,
      price,
      features,
      excludes,
      image,
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getServices, createService, getServiceById };
