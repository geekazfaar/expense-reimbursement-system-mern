
const mongoose = require("mongoose");

const categoryAnnualBudgetSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    budget_year: {
      type: Number,
      required: true,
      min: 2000,
    },
    annual_limit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

categoryAnnualBudgetSchema.index(
  { category_id: 1, budget_year: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CategoryAnnualBudget",
  categoryAnnualBudgetSchema
);
