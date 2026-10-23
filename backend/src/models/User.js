
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["EMPLOYEE", "ADMIN"],
      default: "EMPLOYEE",
      required: true,
    },
    department: {
      type: String,
      maxlength: 100,
      default: null,
    },
    phone: {
      type: String,
      maxlength: 20,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("User", userSchema);
