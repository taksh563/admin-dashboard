import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  changeProductStatus,

  // Image operations
  addProductImages,
  deleteProductImage,
  setPrimaryProductImage,
  replaceProductImages,
} from "../controllers/product.controller.js";

import {
  protect,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// ==========================================================
// GET PRODUCTS
// ==========================================================

router.get(
  "/",
  protect,
  authorize("admin", "manager"),
  getProducts
);

// ==========================================================
// GET SINGLE PRODUCT
// ==========================================================

router.get(
  "/:id",
  protect,
  authorize("admin", "manager"),
  getProductById
);

// ==========================================================
// CREATE PRODUCT
// Multiple images
// ==========================================================

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 10),
  createProduct
);

// ==========================================================
// UPDATE PRODUCT
// Existing CRUD + optional image operations
// ==========================================================

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 10),
  updateProduct
);

// ==========================================================
// CHANGE PRODUCT STATUS
// ==========================================================

router.patch(
  "/:id/status",
  protect,
  authorize("admin", "manager"),
  changeProductStatus
);

// ==========================================================
// ADD PRODUCT IMAGES
// ==========================================================

router.post(
  "/:id/images",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 10),
  addProductImages
);

// ==========================================================
// REPLACE ALL PRODUCT IMAGES
// ==========================================================

router.put(
  "/:id/images",
  protect,
  authorize("admin", "manager"),
  upload.array("images", 10),
  replaceProductImages
);

// ==========================================================
// DELETE PRODUCT IMAGE
// ==========================================================

router.delete(
  "/:id/images/:imageId",
  protect,
  authorize("admin", "manager"),
  deleteProductImage
);

// ==========================================================
// SET PRIMARY IMAGE
// ==========================================================

router.patch(
  "/:id/images/:imageId/primary",
  protect,
  authorize("admin", "manager"),
  setPrimaryProductImage
);

// ==========================================================
// DELETE PRODUCT
// IMPORTANT: Keep this AFTER image routes
// ==========================================================

router.delete(
  "/:id",
  protect,
  authorize("admin", "manager"),
  deleteProduct
);

export default router;