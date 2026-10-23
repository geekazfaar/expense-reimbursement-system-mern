
const Category = require("../models/Category");
const mongoose = require("mongoose");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true })
      .select("name description")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      categories: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);

    return res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};


const createCategory = async (req, res) => {
  const { name, description, annual_budget } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    (description != null && typeof description !== "string") ||
    (annual_budget !== undefined &&
      (!Number.isFinite(Number(annual_budget)) ||
        Number(annual_budget) <= 0))
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid category name, description and budget",
    });
  }

  try {
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        is_active: category.is_active,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    console.error("Create category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

  

const updateCategory = async (req, res) => {
  const { name, description } = req.body;
  const categoryId = req.params.id;

  if (
    !mongoose.Types.ObjectId.isValid(categoryId) ||
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    (description != null && typeof description !== "string")
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid category ID, name and description",
    });
  }

  try {
    const category = await Category.findOneAndUpdate(
      {
        _id: categoryId,
        is_active: true,
      },
      {
        $set: {
          name: name.trim(),
          description: description?.trim() || "",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Active category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        is_active: category.is_active,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    console.error("Update category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

  
  module.exports = {
    getCategories,
    createCategory,
    updateCategory,
  };

