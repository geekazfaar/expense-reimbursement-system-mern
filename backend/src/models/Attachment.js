
const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },
    original_name: {
      type: String,
      required: true,
    },
    stored_name: {
      type: String,
      required: true,
    },
    file_path: {
      type: String,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
      min: 0,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

module.exports = mongoose.model("Attachment", attachmentSchema);
