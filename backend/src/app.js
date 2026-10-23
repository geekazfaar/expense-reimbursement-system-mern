const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const claimRoutes = require("./routes/claimRoutes");
const commentRoutes = require("./routes/commentRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/budgets", budgetRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Reimbursement API is running",
  });
});


app.get("/api/db-test", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
    });
  }
});


module.exports = app;