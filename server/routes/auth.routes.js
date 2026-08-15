import express from "express";

import {
  login,
  profile,
  register,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get(
  "/profile",
  protect,
  profile
);

router.get(
  "/admin-only",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Administrator",
      user: req.user,
    });
  }
);

export default router;