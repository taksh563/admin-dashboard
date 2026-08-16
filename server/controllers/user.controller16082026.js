import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import {createAuditLog,} from "../utils/auditLogger.js";

/**
 * GET /api/users
 * Admin only
 */
export const getUsers = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const search = req.query.search?.trim() || "";

    const filter = search
      ? {
          $or: [
            {
              name: {
                $regex: search,
                $options: "i",
              },
            },
            {
              email: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};


/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });
  }
};


/**
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role || "user";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    if (
      !["admin", "manager", "user"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      
    });
    
    await createAuditLog({req,action: "CREATE",module: "USER",description:`Created user "${user.name}"`, recordId: user._id,
  newData: {name: user.name,email: user.email,role: user.role,isActive: user.isActive,},});
  
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
};


/**
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const name = req.body.name?.trim();
    const email = req.body.email
      ?.trim()
      .toLowerCase();

    const role = req.body.role;

    if (name) {
      user.name = name;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      user.email = email;
    }

    if (role) {
      if (
        !["admin", "manager", "user"].includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      user.role = role;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters",
        });
      }

      user.password = await bcrypt.hash(
        req.body.password,
        12
      );
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update user",
    });
  }
};


/**
 * PATCH /api/users/:id/status
 */
export const updateUserStatus = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = Boolean(req.body.isActive);

    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated",
      data: {
        id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};


/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (
      req.user._id.toString() ===
      req.params.id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete user",
    });
  }
};