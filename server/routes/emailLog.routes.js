import express from "express";

import {
  getEmailLogs,
  getEmailLogById,
} from "../controllers/emailLog.controller.js";

import {
  protect,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Get Email History
router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  getEmailLogs
);

// Get Email Details
router.get(
  "/:id",
  protect,
  authorize("admin", "manager"),
  getEmailLogById
);

export default router;