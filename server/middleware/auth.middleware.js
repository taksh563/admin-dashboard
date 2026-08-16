import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        code: "NO_TOKEN",
        message: "Authentication required.",
      });
    }

    const token =
      authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      // ---------------------------------------
      // JWT expired
      // ---------------------------------------

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Your session has expired.",
        });
      }

      // ---------------------------------------
      // Invalid JWT
      // ---------------------------------------

      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message:
          "Your session is invalid. Please login again.",
      });
    }

    // -----------------------------------------
    // Find user
    // -----------------------------------------

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "Your account could not be found.",
      });
    }

    // -----------------------------------------
    // Check account status
    // -----------------------------------------

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message:
          "Your account is inactive.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Auth middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication service error.",
    });
  }
};