import express from "express";

import {
   createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  changeProductStatus,
} from "../controllers/product.controller.js";

import {
  protect,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";


const router = express.Router();

// Get products
router.get("/",protect,authorize("admin", "manager"),getProducts);



// Get single product

router.get("/:id", protect,authorize("admin", "manager"), getProductById);

// Create product
router.post("/",protect,authorize("admin", "manager"),createProduct);


// Update product
router.put("/:id",protect,authorize("admin", "manager"),updateProduct);


// Change status
router.patch("/:id/status",protect,authorize("admin", "manager"),changeProductStatus);


// Delete product
router.delete("/:id",protect,authorize("admin", "manager"),deleteProduct);

export default router;