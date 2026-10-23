
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Comment", commentSchema);
