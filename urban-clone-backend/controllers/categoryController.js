const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Service = require("../models/Service");

// @desc    Get complete catalog tree (Categories -> SubCategories -> Services)
// @route   GET /api/categories/tree
// @access  Public
const getCatalogTree = async (req, res) => {
  try {
    // 1. Fetch all active categories
    const categories = await Category.find({ isActive: true }).lean();

    // 2. Fetch all active subcategories
    const subCategories = await SubCategory.find({ isActive: true }).lean();

    // 3. Fetch all active services
    const services = await Service.find({ isActive: true }).lean();

    // 4. Construct the Tree (The Architect's way!)
    const tree = categories.map((cat) => {
      // Find subs that belong to this category
      const subsForThisCat = subCategories.filter(
        (sub) => sub.parentCategory.toString() === cat._id.toString(),
      );

      // For each sub, attach its specific services
      const subsWithServices = subsForThisCat.map((sub) => {
        const servicesForThisSub = services.filter(
          (srv) => srv.subCategory.toString() === sub._id.toString(),
        );
        return {
          ...sub,
          services: servicesForThisSub,
        };
      });

      return {
        ...cat,
        subCategories: subsWithServices,
      };
    });

    res.json(tree);
  } catch (error) {
    console.error("Catalog Tree Error:", error);
    res.status(500).json({ message: "Server Error fetching catalog" });
  }
};

// @desc    Create a Category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a SubCategory (Admin)
// @route   POST /api/categories/sub
// @access  Private/Admin
const createSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.create(req.body);
    res.status(201).json(subCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCatalogTree, createCategory, createSubCategory };
