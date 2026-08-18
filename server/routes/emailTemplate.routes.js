import express from "express";

import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  updateTemplateStatus,
} from "../controllers/emailTemplate.controller.js";

import {
  protect,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";


const router = express.Router();

/**
 * =========================================
 * EMAIL TEMPLATE ROUTES
 * =========================================
 *
 * Base URL:
 * /api/email/templates
 *
 */

/**
 * CREATE TEMPLATE
 * POST /api/email/templates
 */
router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  createTemplate
);

/**
 * GET ALL TEMPLATES
 * GET /api/email/templates
 *
 * Query parameters:
 * ?page=1
 * ?limit=10
 * ?search=welcome
 * ?status=ACTIVE
 */
router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  getTemplates
);

/**
 * GET TEMPLATE BY ID
 * GET /api/email/templates/:id
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "manager"),
  getTemplateById
);

/**
 * UPDATE TEMPLATE
 * PUT /api/email/templates/:id
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  updateTemplate
);

/**
 * DELETE TEMPLATE
 * DELETE /api/email/templates/:id
 */
router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  deleteTemplate
);

/**
 * UPDATE TEMPLATE STATUS
 * PATCH /api/email/templates/:id/status
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "manager"),
  updateTemplateStatus
);

export default router;