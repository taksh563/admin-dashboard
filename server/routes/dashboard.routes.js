import express from "express";

import {getDashboard,} from "../controllers/dashboard.controller.js";
import {protect,} from "../middleware/auth.middleware.js";
import {authorize,} from "../middleware/role.middleware.js";
const router =
  express.Router();

// ==========================================================
// GET DASHBOARD
// ==========================================================

router.get(
  "/",
  protect,
  authorize("admin", "manager", "user"),
  getDashboard
);
export default router;