const mongoose = require ("mongoose");
const User = require("../models/User");
const bcrypt = require("bcrypt");


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "full_name email department phone role"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
    });
  }
};



const updateProfile = async (req, res) => {
  try {
    const { full_name, department, phone } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          full_name: full_name.trim(),
          department: department?.trim() || null,
          phone: phone?.trim() || null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("full_name email department phone role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};




const getEmployees = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const searchTerm = search.trim();

    const employees = await User.find({
      role: "EMPLOYEE",
      $or: [
        { full_name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { department: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select(
        "full_name email department phone role is_active created_at"
      )
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      employees: employees.map((employee) => ({
        ...employee,
        id: employee._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

  
  const createEmployee = async (req, res) => {
    try {
      const { full_name, email, password, department, phone } = req.body;
  
      if (!full_name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
        });
      }
  
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const employee = await User.create({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        department: department?.trim() || null,
        phone: phone?.trim() || null,
        role: "EMPLOYEE",
      });
  
      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employee: {
          id: employee._id.toString(),
          full_name: employee.full_name,
          email: employee.email,
          department: employee.department,
          phone: employee.phone,
          role: employee.role,
          is_active: employee.is_active,
          created_at: employee.created_at,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
  
      console.error("Error creating employee:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to create employee",
      });
    }
  };


  const updateEmployee = async (req, res) => {
    try {
      const employeeId = req.params.id;
      const { full_name, email, department, phone } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }
  
      if (!full_name?.trim() || !email?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required",
        });
      }
  
      const employee = await User.findOneAndUpdate(
        {
          _id: employeeId,
          role: "EMPLOYEE",
        },
        {
          $set: {
            full_name: full_name.trim(),
            email: email.trim().toLowerCase(),
            department: department?.trim() || null,
            phone: phone?.trim() || null,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "full_name email department phone role is_active created_at"
      );
  
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        employee: {
          id: employee._id.toString(),
          full_name: employee.full_name,
          email: employee.email,
          department: employee.department,
          phone: employee.phone,
          role: employee.role,
          is_active: employee.is_active,
          created_at: employee.created_at,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
  
      console.error("Error updating employee:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to update employee",
      });
    }
  };
  


  const deactivateEmployee = async (req, res) => {
    try {
      const employeeId = req.params.id;
  
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }
  
      const employee = await User.findOneAndUpdate(
        {
          _id: employeeId,
          role: "EMPLOYEE",
          is_active: true,
        },
        {
          $set: {
            is_active: false,
          },
        },
        {
          new: true,
        }
      ).select("full_name email is_active");
  
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
        employee: {
          id: employee._id.toString(),
          full_name: employee.full_name,
          email: employee.email,
          is_active: employee.is_active,
        },
      });
    } catch (error) {
      console.error("Error deactivating employee:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to deactivate employee",
      });
    }
  };
  
  
  
  

  module.exports = {
    getProfile,
    updateProfile,
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
  };