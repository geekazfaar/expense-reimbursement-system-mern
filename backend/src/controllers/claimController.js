
const mongoose = require("mongoose");

const Claim = require("../models/Claim");
const Category = require("../models/Category");
const CategoryAnnualBudget = require("../models/CategoryAnnualBudget");
const Attachment = require("../models/Attachment");



const createClaim = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      category_id,
      expense_date,
      quantity,
      unit_price,
      description,
    } = req.body;

    const user_id = req.user.id;

    if (
      !category_id ||
      !expense_date ||
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      unit_price === undefined ||
      unit_price === null ||
      unit_price === "" ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        success: false,
        message: "Category must be valid",
      });
    }

    const qty = Number(quantity);
    const price = Number(unit_price);

    if (
      !Number.isFinite(qty) ||
      !Number.isFinite(price) ||
      qty <= 0 ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity and unit price must be positive numbers",
      });
    }

    if (
      typeof expense_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expense_date)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid expense date",
      });
    }

    const [year, month, day] = expense_date.split("-").map(Number);
    const parsedDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid expense date",
      });
    }

    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
    );

    if (parsedDate > todayUTC) {
      return res.status(400).json({
        success: false,
        message: "Expense date cannot be in the future",
      });
    }

    const total_amount = qty * price;

    if (!Number.isFinite(total_amount) || total_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be a valid positive number",
      });
    }

    const budgetYear = year;
    const category = await Category.findById(category_id);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    let createdClaim;
    let remaining;

    await session.withTransaction(async () => {
      const budget = await CategoryAnnualBudget.findOne({
        category_id,
        budget_year: budgetYear,
      }).session(session);

      if (!budget) {
        throw new Error("NO_BUDGET_CONFIGURED");
      }

      const spentResult = await Claim.aggregate([
        {
          $match: {
            user_id: new mongoose.Types.ObjectId(user_id),
            category_id: new mongoose.Types.ObjectId(category_id),
            status: "APPROVED",
            expense_date: {
              $gte: new Date(Date.UTC(budgetYear, 0, 1)),
              $lt: new Date(Date.UTC(budgetYear + 1, 0, 1)),
            },
          },
        },
        {
          $group: {
            _id: null,
            spent: { $sum: "$total_amount" },
          },
        },
      ]).session(session);

      const spent = spentResult[0]?.spent || 0;
      remaining = budget.annual_limit - spent;

      if (total_amount > remaining) {
        throw new Error("BUDGET_EXCEEDED");
      }

      const claims = await Claim.create(
        [
          {
            user_id,
            category_id,
            expense_date: parsedDate,
            quantity: qty,
            unit_price: price,
            total_amount,
            description: description.trim(),
          },
        ],
        { session }
      );

      createdClaim = claims[0];

      const files = req.files || [];

      if (files.length > 0) {
        const attachments = files.map((file) => ({
          claim_id: createdClaim._id,
          original_name: file.originalname,
          stored_name: file.filename,
          file_path: file.path,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: user_id,
        }));

        await Attachment.insertMany(attachments, { session });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Expense claim created successfully",
      claim: {
        id: createdClaim._id.toString(),
        user_id: createdClaim.user_id.toString(),
        category_id: createdClaim.category_id.toString(),
        expense_date: createdClaim.expense_date,
        quantity: createdClaim.quantity,
        unit_price: createdClaim.unit_price,
        total_amount: createdClaim.total_amount,
        description: createdClaim.description,
        status: createdClaim.status,
        created_at: createdClaim.created_at,
      },
      remainingBudget: remaining,
    });
  } catch (error) {
    if (error.message === "NO_BUDGET_CONFIGURED") {
      return res.status(400).json({
        success: false,
        message: "No budget configured for this category and year",
      });
    }

    if (error.message === "BUDGET_EXCEEDED") {
      return res.status(400).json({
        success: false,
        message: "Claim exceeds your remaining annual category budget",
      });
    }

    console.error("Error creating claim:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense claim",
    });
  } finally {
    await session.endSession();
  }
};

  


const getMyClaims = async (req, res) => {
  try {
    const userId = req.user.id;

    const claims = await Claim.find({ user_id: userId })
      .populate("category_id", "name")
      .sort({ created_at: -1 })
      .lean();

    const claimIds = claims.map((claim) => claim._id);

    const attachments = await Attachment.find({
      claim_id: { $in: claimIds },
    })
      .select("claim_id original_name")
      .lean();

    const attachmentsByClaim = {};

    for (const attachment of attachments) {
      const claimId = attachment.claim_id.toString();

      if (!attachmentsByClaim[claimId]) {
        attachmentsByClaim[claimId] = [];
      }

      attachmentsByClaim[claimId].push({
        id: attachment._id.toString(),
        original_name: attachment.original_name,
      });
    }

    return res.status(200).json({
      claims: claims.map((claim) => ({
        id: claim._id.toString(),
        expense_date: claim.expense_date,
        quantity: claim.quantity,
        unit_price: claim.unit_price,
        total_amount: claim.total_amount,
        description: claim.description,
        status: claim.status,
        created_at: claim.created_at,
        category_name: claim.category_id?.name || null,
        attachments: attachmentsByClaim[claim._id.toString()] || [],
      })),
    });
  } catch (error) {
    console.error("Error fetching claims:", error);

    return res.status(500).json({
      message: "Failed to fetch expense claims",
    });
  }
};

  

const cancelClaim = async (req, res) => {
  try {
    const claimId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        message: "Invalid claim ID",
      });
    }

    const claim = await Claim.findOneAndUpdate(
      {
        _id: claimId,
        user_id: userId,
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found or cannot be cancelled",
      });
    }

    return res.status(200).json({
      message: "Expense claim cancelled successfully",
      claim: {
        id: claim._id.toString(),
        user_id: claim.user_id.toString(),
        category_id: claim.category_id.toString(),
        expense_date: claim.expense_date,
        quantity: claim.quantity,
        unit_price: claim.unit_price,
        total_amount: claim.total_amount,
        description: claim.description,
        status: claim.status,
        created_at: claim.created_at,
      },
    });
  } catch (error) {
    console.error("Error cancelling claim:", error);

    return res.status(500).json({
      message: "Failed to cancel expense claim",
    });
  }
};



const getAllClaims = async (req, res) => {
  try {
    
    const claims = await Claim.find()
      .populate("category_id", "name")
      .populate("user_id", "full_name email department")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      claims: claims.map((claim) => ({
        id: claim._id.toString(),
        user_id: claim.user_id?._id.toString() || null,
        category_id: claim.category_id?._id.toString() || null,
        expense_date: claim.expense_date,
        quantity: claim.quantity,
        unit_price: claim.unit_price,
        total_amount: claim.total_amount,
        description: claim.description,
        status: claim.status,
        created_at: claim.created_at,
        category_name: claim.category_id?.name || null,
        employee_name: claim.user_id?.full_name || null,
        employee_email: claim.user_id?.email || null,
        department: claim.user_id?.department || null,
      })),
    });
  } catch (error) {
    console.error("Get all claims error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
    });
  }
};


const approveClaim = async (req, res) => {
  let session;

  try {
    const claimId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    session = await mongoose.startSession();

    let approvedClaim;
    let remainingBudget;

    await session.withTransaction(async () => {
      const claim = await Claim.findById(claimId).session(session);

      if (!claim) {
        const error = new Error("Claim not found");
        error.code = "CLAIM_NOT_FOUND";
        throw error;
      }

      if (claim.status !== "PENDING") {
        const error = new Error("Only pending claims can be approved");
        error.code = "CLAIM_NOT_PENDING";
        throw error;
      }

      const budgetYear = new Date(claim.expense_date).getUTCFullYear();

      const budget = await CategoryAnnualBudget.findOne({
        category_id: claim.category_id,
        budget_year: budgetYear,
      }).session(session);

      if (!budget) {
        const error = new Error(
          "No budget configured for this category and year"
        );
        error.code = "NO_BUDGET";
        throw error;
      }

      const yearStart = new Date(Date.UTC(budgetYear, 0, 1));
      const nextYearStart = new Date(Date.UTC(budgetYear + 1, 0, 1));

      const spentResult = await Claim.aggregate([
        {
          $match: {
            user_id: claim.user_id,
            category_id: claim.category_id,
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
            spent: { $sum: "$total_amount" },
          },
        },
      ]).session(session);

      const spent = spentResult[0]?.spent || 0;

      remainingBudget = budget.annual_limit - spent;

      if (claim.total_amount > remainingBudget) {
        const error = new Error(
          "Insufficient remaining budget to approve this claim"
        );
        error.code = "INSUFFICIENT_BUDGET";
        error.remainingBudget = remainingBudget;
        throw error;
      }

      // Coordinate approvals that use the same budget document.
      await CategoryAnnualBudget.updateOne(
        { _id: budget._id },
        { $set: { updated_at: new Date() } },
        { session }
      );

      approvedClaim = await Claim.findOneAndUpdate(
        {
          _id: claim._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "APPROVED",
            reviewed_by: req.user.id,
            reviewed_at: new Date(),
            rejection_reason: null,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!approvedClaim) {
        const error = new Error("Only pending claims can be approved");
        error.code = "CLAIM_NOT_PENDING";
        throw error;
      }

      remainingBudget -= claim.total_amount;
    });

    return res.status(200).json({
      success: true,
      message: "Claim approved successfully",
      claim: {
        id: approvedClaim._id.toString(),
        user_id: approvedClaim.user_id.toString(),
        category_id: approvedClaim.category_id.toString(),
        expense_date: approvedClaim.expense_date,
        total_amount: approvedClaim.total_amount,
        status: approvedClaim.status,
        reviewed_by: approvedClaim.reviewed_by?.toString() || null,
        reviewed_at: approvedClaim.reviewed_at,
        rejection_reason: approvedClaim.rejection_reason,
        created_at: approvedClaim.created_at,
        updated_at: approvedClaim.updated_at,
      },
      remainingBudget,
    });
  } catch (error) {
    if (error.code === "CLAIM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "CLAIM_NOT_PENDING") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "NO_BUDGET") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "INSUFFICIENT_BUDGET") {
      return res.status(400).json({
        success: false,
        message: error.message,
        remainingBudget: error.remainingBudget,
      });
    }

    console.error("Approve claim error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve claim",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

  


const rejectClaim = async (req, res) => {
  const reason =
    typeof req.body.reason === "string" ? req.body.reason.trim() : "";

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: "A rejection reason is required",
    });
  }

  try {
    const claimId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim ID",
      });
    }

    const claim = await Claim.findOneAndUpdate(
      {
        _id: claimId,
        status: "PENDING",
      },
      {
        $set: {
          status: "REJECTED",
          rejection_reason: reason,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!claim) {
      const existingClaim = await Claim.exists({ _id: claimId });

      return res.status(existingClaim ? 409 : 404).json({
        success: false,
        message: existingClaim
          ? "Only pending claims can be rejected"
          : "Claim not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim rejected successfully",
      claim: {
        id: claim._id.toString(),
        user_id: claim.user_id.toString(),
        category_id: claim.category_id.toString(),
        expense_date: claim.expense_date,
        total_amount: claim.total_amount,
        status: claim.status,
        rejection_reason: claim.rejection_reason,
        reviewed_by: claim.reviewed_by?.toString() || null,
        reviewed_at: claim.reviewed_at,
        created_at: claim.created_at,
        updated_at: claim.updated_at,
      },
    });
  } catch (error) {
    console.error("Reject claim error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject claim",
    });
  }
};



const getReceipt = async (req, res) => {
    try {
      const attachmentId = Number(req.params.attachmentId);
      const userId = req.user.id;
      const isAdmin = req.user.role === "ADMIN";
  
      if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid attachment ID",
        });
      }
  
      const result = await pool.query(
        `SELECT a.file_path, a.original_name, c.user_id
         FROM attachments a
         JOIN claims c ON c.id = a.claim_id
         WHERE a.id = $1`,
        [attachmentId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }
  
      const receipt = result.rows[0];
  
      if (!isAdmin && Number(receipt.user_id) !== Number(userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this receipt",
        });
      }
  
      return res.download(receipt.file_path, receipt.original_name);
    } catch (error) {
      console.error("Error retrieving receipt:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve receipt",
      });
    }
  };
  

  module.exports = {
    createClaim,
    getMyClaims,
    cancelClaim,
    getAllClaims,
    approveClaim,
    rejectClaim,
    getReceipt,
  };