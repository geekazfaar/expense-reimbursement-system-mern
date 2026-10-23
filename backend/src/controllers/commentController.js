const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Comment = require("../models/Comment");


const addComment = async (req, res) => {
  try {
    const claimId = req.params.id;
    const userId = req.user.id;
    const { comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        message: "Invalid claim ID",
      });
    }

    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    const claim = await Claim.findOne(
      isAdmin
        ? { _id: claimId }
        : { _id: claimId, user_id: userId }
    );

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    const newComment = await Comment.create({
      claim_id: claimId,
      user_id: userId,
      message: comment.trim(),
    });

    return res.status(201).json({
      message: "Comment added successfully",
      comment: {
        id: newComment._id.toString(),
        claim_id: newComment.claim_id.toString(),
        user_id: newComment.user_id.toString(),
        message: newComment.message,
        created_at: newComment.created_at,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);

    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};


const getComments = async (req, res) => {
  try {
    const claimId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        message: "Invalid claim ID",
      });
    }

    const claim = await Claim.findOne(
      isAdmin
        ? { _id: claimId }
        : { _id: claimId, user_id: userId }
    );

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    const comments = await Comment.find({ claim_id: claimId })
      .populate("user_id", "full_name")
      .sort({ created_at: 1 })
      .lean();

    return res.status(200).json({
      comments: comments.map((comment) => ({
        id: comment._id.toString(),
        claim_id: comment.claim_id.toString(),
        user_id: comment.user_id?._id.toString() || null,
        message: comment.message,
        created_at: comment.created_at,
        full_name: comment.user_id?.full_name || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return res.status(500).json({
      message: "Failed to fetch comments",
    });
  }
};

module.exports = {
    addComment,
    getComments,
  };