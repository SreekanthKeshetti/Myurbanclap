const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true, // e.g., "Electrician", "Dog Walking"
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SubCategory", subCategorySchema);
