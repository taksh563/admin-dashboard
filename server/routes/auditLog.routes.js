import express from "express";

import {
  getAuditLogs,
} from "../controllers/auditLog.controller.js";

import {
  protect,
} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.get(
  "/",
  protect,
  getAuditLogs
);

export default router;