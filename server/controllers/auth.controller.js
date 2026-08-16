import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import { createAuditLog, } from "../utils/auditLogger.js";

/**
 * Register User
 */
export const register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    // -----------------------------------------
    // Validate input
    // -----------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    // -----------------------------------------
    // Validate password
    // -----------------------------------------

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // -----------------------------------------
    // Check existing user
    // -----------------------------------------

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: "EMAIL_ALREADY_EXISTS",
        message: "User already exists",
      });
    }

    // -----------------------------------------
    // Hash password
    // -----------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // -----------------------------------------
    // Create user
    // -----------------------------------------

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      // Never allow public registration
      // to create admin users
      role: "user",

      isActive: true,
    });

    // -----------------------------------------
    // Generate JWT
    // -----------------------------------------

    const token = generateToken(user);

    // -----------------------------------------
    // Response
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during registration",
    });
  }
};


/**
 * Login User
 */
export const login = async (req, res) => {
  try {
    const email =
      req.body.email
        ?.trim()
        .toLowerCase();

    const password =
      req.body.password;

    // -----------------------------------------
    // Validate input
    // -----------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: "MISSING_CREDENTIALS",
        message:
          "Email and password are required.",
      });
    }

    // -----------------------------------------
    // Find user
    // -----------------------------------------

    const user = await User.findOne({
      email,
    });

    // -----------------------------------------
    // Email doesn't exist
    // -----------------------------------------

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "EMAIL_NOT_FOUND",
        message:
          "Email address does not exist.",
      });
    }

    // -----------------------------------------
    // Check account status
    // -----------------------------------------

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message:
          "Your account is inactive. Please contact the administrator.",
      });
    }

    // -----------------------------------------
    // Check password
    // -----------------------------------------

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    // -----------------------------------------
    // Wrong password
    // -----------------------------------------

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message:
          "Incorrect password.",
      });
    }

    // -----------------------------------------
    // Generate JWT
    // -----------------------------------------

    const token =
      generateToken(user);

    // -----------------------------------------
    // Login successful
    // -----------------------------------------

     await createAuditLog({
      req,
      user,
      action: "LOGIN",
      module: "AUTH",
      description:`User "${user.name}" logged in successfully.`,
      recordId: user._id,
      newData: {
        email: user.email,
        role: user.role,
      },
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
    });
   
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong. Please try again.",
    });
  }
};


/**
 * Get Logged-in User Profile
 */
export const profile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch profile",
    });
  }
};