import express from "express";

import {
  sendEmail,
} from "../controllers/email.controller.js";

import {protect,} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.post(
  "/send",
  protect,
  sendEmail
);

export default router;