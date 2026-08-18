import express from "express";

import {
  sendEmail,
  getEmailLogById,
  resendEmail,
  getEmailLogs,
  sendPersonalizedEmail
  
} from "../controllers/email.controller.js";

import {protect,} from "../middleware/auth.middleware.js";
import {authorize,} from "../middleware/role.middleware.js";

const router =
  express.Router();

// Send email
router.post(
  "/send",
  protect,
  authorize("admin", "manager"),
  sendEmail
);

// Get email logs
router.get(
  "/logs",
  protect,
  authorize("admin", "manager"),
  getEmailLogs
);

// Get single email log
router.get(
  "/logs/:id",
  protect,
  authorize("admin", "manager"),
  getEmailLogById
);

// Resend failed email
router.post(
  "/logs/:id/resend",
  protect,
  authorize("admin", "manager"),
  resendEmail
);

router.post(
  "/send-personalized",
  protect,
  authorize("admin", "manager"),
  sendPersonalizedEmail
);

export default router;