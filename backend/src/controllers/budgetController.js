const mongoose = require("mongoose");
const Category = require("../models/Category");
const CategoryAnnualBudget = require("../models/CategoryAnnualBudget");


const setBudget = async (req, res) => {
  const { category_id, budget_year, annual_limit } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(category_id) ||
    !Number.isInteger(Number(budget_year)) ||
    Number(budget_year) < 2000 ||
    Number(budget_year) > 2100 ||
    annual_limit === undefined ||
    annual_limit === null ||
    annual_limit === "" ||
    !Number.isFinite(Number(annual_limit)) ||
    Number(annual_limit) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid category, year and positive budget limit",
    });
  }

  try {
    const category = await Category.findOne({
      _id: category_id,
      is_active: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Active category not found",
      });
    }

    const budget = await CategoryAnnualBudget.findOneAndUpdate(
      {
        category_id,
        budget_year: Number(budget_year),
      },
      {
        $set: {
          annual_limit: Number(annual_limit),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Category annual budget saved successfully",
      budget: {
        id: budget._id.toString(),
        category_id: budget.category_id.toString(),
        budget_year: budget.budget_year,
        annual_limit: budget.annual_limit,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
      },
    });
  } catch (error) {
    console.error("Set budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save category annual budget",
    });
  }
};

  

 
const Claim = require("../models/Claim");

const getBudgets = async (req, res) => {
  try {
    const budgets = await CategoryAnnualBudget.find()
      .populate("category_id", "name")
      .sort({ budget_year: -1 })
      .lean();

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const yearStart = new Date(
          Date.UTC(budget.budget_year, 0, 1)
        );

        const nextYearStart = new Date(
          Date.UTC(budget.budget_year + 1, 0, 1)
        );

        const spending = await Claim.aggregate([
          {
            $match: {
              category_id: budget.category_id._id,
              status: "APPROVED",
              expense_date: {
                $gte: yearStart,
                $lt: nextYearStart,
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total_amount" },
            },
          },
        ]);

        return {
          id: budget._id.toString(),
          category_id: budget.category_id._id.toString(),
          category_name: budget.category_id.name,
          budget_year: budget.budget_year,
          annual_limit: budget.annual_limit,
          total_approved_amount: spending[0]?.total || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      budgets: results,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category budgets",
    });
  }
};


module.exports = { setBudget, getBudgets };
