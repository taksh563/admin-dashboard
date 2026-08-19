import mongoose from "mongoose";

import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import AuditLog from "../models/auditLog.model.js";

// ==========================================================
// HELPER: GET USER INFORMATION
// ==========================================================

const getUserInfo = (req) => {
  return {
    userId:
      req.user?._id ||
      req.user?.id ||
      null,

    name:
      req.user?.name ||
      req.user?.fullName ||
      "System",

    email:
      req.user?.email ||
      "",
  };
};

// ==========================================================
// HELPER: GET REQUEST METADATA
// ==========================================================

const getRequestMetadata = (req) => {
  return {
    ipAddress:
      req.ip ||
      req.headers["x-forwarded-for"] ||
      "",

    userAgent:
      req.headers["user-agent"] ||
      "",
  };
};

// ==========================================================
// HELPER: CREATE AUDIT LOG
// ==========================================================

const createAuditLog = async ({
  req,
  action,
  recordId,
  oldData = null,
  newData = null,
}) => {
  try {
    const user = getUserInfo(req);
    const metadata =
      getRequestMetadata(req);

    await AuditLog.create({
      action,

      module: "PRODUCT",

      recordId,

      userId: user.userId,

      userName: user.name,

      userEmail: user.email,

      oldData,

      newData,

      ipAddress:
        metadata.ipAddress,

      userAgent:
        metadata.userAgent,
    });
  } catch (auditError) {
    // Audit failure should never break
    // the main product operation.
    console.error(
      "Audit log error:",
      auditError
    );
  }
};

// ==========================================================
// HELPER: VALIDATE OBJECT ID
// ==========================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

// ==========================================================
// HELPER: GET PRODUCT DATA FOR AUDIT
// ==========================================================

const getProductAuditData = (
  product
) => {
  if (!product) {
    return null;
  }

  return {
    _id: product._id,

    name: product.name,

    sku: product.sku,

    description:
      product.description || "",

    price: product.price,

    stock: product.stock,

    categories:
      Array.isArray(
        product.categories
      )
        ? product.categories.map(
            (category) =>
              category?._id ||
              category
          )
        : [],

    isActive:
      Boolean(product.isActive),
  };
};

// ==========================================================
// CREATE PRODUCT
// ==========================================================

export const createProduct = async (
  req,
  res
) => {
  try {
    const {
      name,
      sku,
      description = "",
      price,
      stock = 0,
      categories = [],
      isActive = true,
    } = req.body;

    // ------------------------------------------------------
    // VALIDATE NAME
    // ------------------------------------------------------

    const productName =
      String(name || "").trim();

    if (!productName) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
      });
    }

    // ------------------------------------------------------
    // VALIDATE SKU
    // ------------------------------------------------------

    const productSku = String(
      sku || ""
    )
      .trim()
      .toUpperCase();

    if (!productSku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required.",
      });
    }

    // ------------------------------------------------------
    // VALIDATE PRICE
    // ------------------------------------------------------

    const productPrice =
      Number(price);

    if (
      Number.isNaN(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid non-negative price.",
      });
    }

    // ------------------------------------------------------
    // VALIDATE STOCK
    // ------------------------------------------------------

    const productStock =
      Number(stock);

    if (
      Number.isNaN(productStock) ||
      productStock < 0 ||
      !Number.isInteger(
        productStock
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock must be a valid non-negative whole number.",
      });
    }

    // ------------------------------------------------------
    // VALIDATE CATEGORIES
    // ------------------------------------------------------

    if (
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least one category.",
      });
    }

    const uniqueCategoryIds = [
      ...new Set(
        categories.map((id) =>
          String(id)
        )
      ),
    ];

    const invalidCategory =
      uniqueCategoryIds.some(
        (id) =>
          !isValidObjectId(id)
      );

    if (invalidCategory) {
      return res.status(400).json({
        success: false,
        message:
          "One or more category IDs are invalid.",
      });
    }

    // ------------------------------------------------------
    // CHECK ACTIVE CATEGORIES
    // ------------------------------------------------------

    const activeCategories =
      await Category.find({
        _id: {
          $in: uniqueCategoryIds,
        },

        isActive: true,
      }).select("_id");

    if (
      activeCategories.length !==
      uniqueCategoryIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected categories are inactive or do not exist.",
      });
    }

    // ------------------------------------------------------
    // CHECK DUPLICATE SKU
    // ------------------------------------------------------

    const existingProduct =
      await Product.findOne({
        sku: productSku,
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists.",
      });
    }

    // ------------------------------------------------------
    // CREATE PRODUCT
    // ------------------------------------------------------

    const product =
      await Product.create({
        name: productName,

        sku: productSku,

        description:
          String(
            description || ""
          ).trim(),

        price: productPrice,

        stock: productStock,

        categories:
          uniqueCategoryIds,

        isActive:
          Boolean(isActive),
      });

    // ------------------------------------------------------
    // POPULATE CATEGORIES
    // ------------------------------------------------------

    await product.populate({
      path: "categories",
      select: "name slug isActive",
    });

    // ------------------------------------------------------
    // AUDIT LOG
    // ------------------------------------------------------

    await createAuditLog({
      req,

      action: "CREATE",

      recordId:
        product._id,

      oldData: null,

      newData:
        getProductAuditData(
          product
        ),
    });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Product created successfully.",

      data: product,
    });
  } catch (err) {
    console.error(
      "Create product error:",
      err
    );

    // ------------------------------------------------------
    // DUPLICATE KEY ERROR
    // ------------------------------------------------------

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create product.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : undefined,
    });
  }
};

// ==========================================================
// GET PRODUCTS
// ADVANCED SEARCH + FILTER + SORT + PAGINATION
// ==========================================================

export const getProducts = async (
  req,
  res
) => {
  try {
    // ------------------------------------------------------
    // PAGINATION
    // ------------------------------------------------------

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    const search =
      String(
        req.query.search || ""
      ).trim();

    // ------------------------------------------------------
    // FILTERS
    // ------------------------------------------------------

    const category =
      req.query.category ||
      req.query.categoryId ||
      "";

    const status =
      req.query.status || "";

    const minPrice =
      req.query.minPrice;

    const maxPrice =
      req.query.maxPrice;

    const minStock =
      req.query.minStock;

    const maxStock =
      req.query.maxStock;

    const lowStock =
      req.query.lowStock;

    // ------------------------------------------------------
    // SORT
    // ------------------------------------------------------

    const allowedSortFields = [
      "name",
      "sku",
      "price",
      "stock",
      "isActive",
      "createdAt",
      "updatedAt",
    ];

    let sortBy =
      req.query.sortBy ||
      "createdAt";

    let sortOrder =
      String(
        req.query.sortOrder ||
          "desc"
      ).toLowerCase();

    // Prevent invalid sort fields
    if (
      !allowedSortFields.includes(
        sortBy
      )
    ) {
      sortBy = "createdAt";
    }

    // Only allow asc / desc
    if (
      !["asc", "desc"].includes(
        sortOrder
      )
    ) {
      sortOrder = "desc";
    }

    const sortDirection =
      sortOrder === "asc"
        ? 1
        : -1;

    const sort = {
      [sortBy]:
        sortDirection,
    };

    // Stable secondary sorting
    if (sortBy !== "_id") {
      sort._id = -1;
    }

    // ------------------------------------------------------
    // BUILD QUERY
    // ------------------------------------------------------

    const query = {};

    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },

        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ------------------------------------------------------
    // CATEGORY FILTER
    // ------------------------------------------------------

    if (category) {
      if (
        !isValidObjectId(category)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category ID.",
        });
      }

      query.categories = category;
    }

    // ------------------------------------------------------
    // STATUS FILTER
    // ------------------------------------------------------

    if (status) {
      if (
        ![
          "active",
          "inactive",
          "all",
        ].includes(
          String(status).toLowerCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status filter.",
        });
      }

      if (
        String(status).toLowerCase() ===
        "active"
      ) {
        query.isActive = true;
      }

      if (
        String(status).toLowerCase() ===
        "inactive"
      ) {
        query.isActive = false;
      }
    }

    // ------------------------------------------------------
    // PRICE RANGE
    // ------------------------------------------------------

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      query.price = {};

      if (
        minPrice !== undefined &&
        minPrice !== ""
      ) {
        const value =
          Number(minPrice);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid minimum price.",
          });
        }

        query.price.$gte = value;
      }

      if (
        maxPrice !== undefined &&
        maxPrice !== ""
      ) {
        const value =
          Number(maxPrice);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid maximum price.",
          });
        }

        query.price.$lte = value;
      }
    }

    // ------------------------------------------------------
    // STOCK RANGE
    // ------------------------------------------------------

    if (
      minStock !== undefined ||
      maxStock !== undefined
    ) {
      query.stock = {};

      if (
        minStock !== undefined &&
        minStock !== ""
      ) {
        const value =
          Number(minStock);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid minimum stock.",
          });
        }

        query.stock.$gte = value;
      }

      if (
        maxStock !== undefined &&
        maxStock !== ""
      ) {
        const value =
          Number(maxStock);

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid maximum stock.",
          });
        }

        query.stock.$lte = value;
      }
    }

    // ------------------------------------------------------
    // LOW STOCK FILTER
    // ------------------------------------------------------
    // Example:
    // ?lowStock=5
    //
    // Returns products with stock <= 5
    // ------------------------------------------------------

    if (
      lowStock !== undefined &&
      lowStock !== ""
    ) {
      const value =
        Number(lowStock);

      if (
        Number.isNaN(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid low stock value.",
        });
      }

      query.stock = {
        ...(query.stock || {}),
        $lte: value,
      };
    }

    // ------------------------------------------------------
    // PRICE VALIDATION
    // ------------------------------------------------------

    if (
      query.price?.$gte !== undefined &&
      query.price?.$lte !== undefined &&
      query.price.$gte >
        query.price.$lte
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum price cannot be greater than maximum price.",
      });
    }

    // ------------------------------------------------------
    // STOCK VALIDATION
    // ------------------------------------------------------

    if (
      query.stock?.$gte !== undefined &&
      query.stock?.$lte !== undefined &&
      query.stock.$gte >
        query.stock.$lte
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum stock cannot be greater than maximum stock.",
      });
    }

    // ------------------------------------------------------
    // DEBUG
    // ------------------------------------------------------

    console.log(
      "Product query:",
      JSON.stringify(
        query,
        null,
        2
      )
    );

    console.log(
      "Product sort:",
      sort
    );

    // ------------------------------------------------------
    // TOTAL
    // ------------------------------------------------------

    const total =
      await Product.countDocuments(
        query
      );

    // ------------------------------------------------------
    // FETCH PRODUCTS
    // ------------------------------------------------------

    const products =
      await Product.find(query)
        .populate({
          path: "categories",
          select:
            "name slug isActive",
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    // ------------------------------------------------------
    // PAGINATION
    // ------------------------------------------------------

    const totalPages =
      Math.ceil(
        total / limit
      );

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      data: products,

      pagination: {
        page,

        limit,

        total,

        totalPages,
      },
    });
  } catch (err) {
    console.error(
      "Get products error:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load products.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : undefined,
    });
  }
};

// ==========================================================
// GET PRODUCT BY ID
// ==========================================================

export const getProductById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------
    // VALIDATE ID
    // ------------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    // ------------------------------------------------------
    // FIND PRODUCT
    // ------------------------------------------------------

    const product =
      await Product.findById(id)
        .populate({
          path: "categories",
          select:
            "name slug isActive",
        });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,

      data: product,
    });
  } catch (err) {
    console.error(
      "Get product by ID error:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load product.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : undefined,
    });
  }
};

// ==========================================================
// UPDATE PRODUCT
// ==========================================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------
    // VALIDATE ID
    // ------------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    // ------------------------------------------------------
    // FIND PRODUCT
    // ------------------------------------------------------

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    // ------------------------------------------------------
    // SAVE OLD DATA
    // ------------------------------------------------------

    const oldData =
      getProductAuditData(
        product
      );

    // ------------------------------------------------------
    // REQUEST DATA
    // ------------------------------------------------------

    const {
      name,
      sku,
      description,
      price,
      stock,
      categories,
      isActive,
    } = req.body;

    // ------------------------------------------------------
    // NAME
    // ------------------------------------------------------

    if (name !== undefined) {
      const productName =
        String(name).trim();

      if (!productName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      if (
        productName.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product name must be at least 2 characters.",
        });
      }

      if (
        productName.length > 150
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product name cannot exceed 150 characters.",
        });
      }

      product.name =
        productName;
    }

    // ------------------------------------------------------
    // SKU
    // ------------------------------------------------------

    if (sku !== undefined) {
      const productSku =
        String(sku)
          .trim()
          .toUpperCase();

      if (!productSku) {
        return res.status(400).json({
          success: false,
          message:
            "SKU is required.",
        });
      }

      if (
        productSku.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "SKU must be at least 2 characters.",
        });
      }

      if (
        productSku.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "SKU cannot exceed 100 characters.",
        });
      }

      // Check duplicate SKU
      const duplicateSku =
        await Product.findOne({
          sku: productSku,

          _id: {
            $ne: id,
          },
        });

      if (duplicateSku) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this SKU already exists.",
        });
      }

      product.sku =
        productSku;
    }

    // ------------------------------------------------------
    // DESCRIPTION
    // ------------------------------------------------------

    if (
      description !== undefined
    ) {
      product.description =
        String(
          description || ""
        ).trim();
    }

    // ------------------------------------------------------
    // PRICE
    // ------------------------------------------------------

    if (price !== undefined) {
      const productPrice =
        Number(price);

      if (
        Number.isNaN(
          productPrice
        ) ||
        productPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid non-negative price.",
        });
      }

      product.price =
        productPrice;
    }

    // ------------------------------------------------------
    // STOCK
    // ------------------------------------------------------

    if (stock !== undefined) {
      const productStock =
        Number(stock);

      if (
        Number.isNaN(
          productStock
        ) ||
        productStock < 0 ||
        !Number.isInteger(
          productStock
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid non-negative whole number.",
        });
      }

      product.stock =
        productStock;
    }

    // ------------------------------------------------------
    // CATEGORIES
    // ------------------------------------------------------

    if (
      categories !== undefined
    ) {
      if (
        !Array.isArray(
          categories
        ) ||
        categories.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select at least one category.",
        });
      }

      const uniqueCategoryIds = [
        ...new Set(
          categories.map((category) =>
            String(category)
          )
        ),
      ];

      const invalidCategory =
        uniqueCategoryIds.some(
          (categoryId) =>
            !isValidObjectId(
              categoryId
            )
        );

      if (invalidCategory) {
        return res.status(400).json({
          success: false,
          message:
            "One or more category IDs are invalid.",
        });
      }

      const activeCategories =
        await Category.find({
          _id: {
            $in: uniqueCategoryIds,
          },

          isActive: true,
        }).select("_id");

      if (
        activeCategories.length !==
        uniqueCategoryIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected categories are inactive or do not exist.",
        });
      }

      product.categories =
        uniqueCategoryIds;
    }

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    if (
      isActive !== undefined
    ) {
      product.isActive =
        Boolean(isActive);
    }

    // ------------------------------------------------------
    // SAVE
    // ------------------------------------------------------

    await product.save();

    // ------------------------------------------------------
    // POPULATE
    // ------------------------------------------------------

    await product.populate({
      path: "categories",
      select:
        "name slug isActive",
    });

    // ------------------------------------------------------
    // NEW DATA
    // ------------------------------------------------------

    const newData =
      getProductAuditData(
        product
      );

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    await createAuditLog({
      req,

      action: "UPDATE",

      recordId:
        product._id,

      oldData,

      newData,
    });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Product updated successfully.",

      data: product,
    });
  } catch (err) {
    console.error(
      "Update product error:",
      err
    );

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Unable to update product.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : undefined,
    });
  }
};

// ==========================================================
// DELETE PRODUCT
// ==========================================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ------------------------------------------------------
    // VALIDATE ID
    // ------------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    // ------------------------------------------------------
    // FIND PRODUCT
    // ------------------------------------------------------

    const product =
      await Product.findById(id)
        .populate({
          path: "categories",
          select:
            "name slug isActive",
        });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    // ------------------------------------------------------
    // SAVE AUDIT DATA
    // ------------------------------------------------------

    const oldData =
      getProductAuditData(
        product
      );

    // ------------------------------------------------------
    // DELETE
    // ------------------------------------------------------

    await Product.findByIdAndDelete(
      id
    );

    // ------------------------------------------------------
    // AUDIT
    // ------------------------------------------------------

    await createAuditLog({
      req,

      action: "DELETE",

      recordId: id,

      oldData,

      newData: null,
    });

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Product deleted successfully.",

      data: null,
    });
  } catch (err) {
    console.error(
      "Delete product error:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to delete product.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? err.message
          : undefined,
    });
  }
};

// ==========================================================
// CHANGE PRODUCT STATUS
// ==========================================================

export const changeProductStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      // ----------------------------------------------------
      // VALIDATE ID
      // ----------------------------------------------------

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      // ----------------------------------------------------
      // GET STATUS
      // ----------------------------------------------------

      const {
        isActive,
      } = req.body;

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        });
      }

      // ----------------------------------------------------
      // FIND PRODUCT
      // ----------------------------------------------------

      const product =
        await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // ----------------------------------------------------
      // OLD DATA
      // ----------------------------------------------------

      const oldData =
        getProductAuditData(
          product
        );

      // ----------------------------------------------------
      // CHANGE STATUS
      // ----------------------------------------------------

      product.isActive =
        isActive;

      await product.save();

      // ----------------------------------------------------
      // POPULATE
      // ----------------------------------------------------

      await product.populate({
        path: "categories",
        select:
          "name slug isActive",
      });

      // ----------------------------------------------------
      // NEW DATA
      // ----------------------------------------------------

      const newData =
        getProductAuditData(
          product
        );

      // ----------------------------------------------------
      // AUDIT
      // ----------------------------------------------------

      await createAuditLog({
        req,

        action:
          "STATUS_UPDATE",

        recordId:
          product._id,

        oldData,

        newData,
      });

      // ----------------------------------------------------
      // RESPONSE
      // ----------------------------------------------------

      return res.status(200).json({
        success: true,

        message: isActive
          ? "Product activated successfully."
          : "Product deactivated successfully.",

        data: product,
      });
    } catch (err) {
      console.error(
        "Change product status error:",
        err
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to change product status.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? err.message
            : undefined,
      });
    }
  };