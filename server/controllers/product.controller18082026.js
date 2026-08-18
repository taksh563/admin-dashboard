import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import AuditLog from "../models/auditLog.model.js";

// ======================================================
// AUDIT LOG HELPER
// ======================================================

const createAuditLog = async ({
  req,
  action,
  description,
  recordId = null,
  oldData = null,
  newData = null,
  status = "SUCCESS",
  errorMessage = null,
}) => {
  try {
    await AuditLog.create({
      user: req.user?._id || null,

      userName:
        req.user?.name ||
        null,

      userEmail:
        req.user?.email ||
        null,

      action,

      module: "PRODUCT",

      description,

      recordId,

      oldData,

      newData,

      method:
        req.method ||
        null,

      endpoint:
        req.originalUrl ||
        null,

      ipAddress:
        req.ip ||
        req.headers?.["x-forwarded-for"] ||
        null,

      userAgent:
        req.headers?.["user-agent"] ||
        null,

      status,

      errorMessage,
    });
  } catch (error) {
    // Audit logging should NEVER break the
    // actual product operation.

    console.error(
      "Audit log error:",
      error
    );
  }
};

// ======================================================
// PRODUCT DATA HELPER
// ======================================================

const getProductAuditData = (product) => {
  if (!product) {
    return null;
  }

  return {
    id: product._id,

    name: product.name,

    sku: product.sku,

    description:
      product.description || "",

    price: product.price,

    stock: product.stock,

    categories:
      (product.categories || []).map(
        (category) => {
          if (
            typeof category ===
            "object"
          ) {
            return {
              _id:
                category._id,

              name:
                category.name,
            };
          }

          return category;
        }
      ),

    isActive:
      Boolean(product.isActive),
  };
};

// ======================================================
// CREATE PRODUCT
// ======================================================

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

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !name ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
      });
    }

    if (
      !sku ||
      !sku.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SKU is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid price.",
      });
    }

    if (
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock cannot be negative.",
      });
    }

    // ==================================================
    // CATEGORY VALIDATION
    // ==================================================

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
        categories.map(
          (id) => String(id)
        )
      ),
    ];

    const categoryDocuments =
      await Category.find({
        _id: {
          $in: uniqueCategoryIds,
        },

        isActive: true,
      }).select(
        "_id name"
      );

    if (
      categoryDocuments.length !==
      uniqueCategoryIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected categories are invalid or inactive.",
      });
    }

    // ==================================================
    // CHECK DUPLICATE SKU
    // ==================================================

    const existingSku =
      await Product.findOne({
        sku: sku
          .trim()
          .toUpperCase(),
      });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists.",
      });
    }

    // ==================================================
    // CREATE PRODUCT
    // ==================================================

    const product =
      await Product.create({
        name: name.trim(),

        sku: sku
          .trim()
          .toUpperCase(),

        description:
          description.trim(),

        price: Number(price),

        stock: Number(stock),

        categories:
          uniqueCategoryIds,

        isActive:
          Boolean(isActive),
      });

    // ==================================================
    // POPULATE CATEGORIES
    // ==================================================

    const populatedProduct =
      await Product.findById(
        product._id
      ).populate(
        "categories",
        "_id name description isActive"
      );

    // ==================================================
    // AUDIT LOG
    // ==================================================

    await createAuditLog({
      req,

      action: "CREATE",

      description:
        `Product "${populatedProduct.name}" created.`,

      recordId:
        populatedProduct._id,

      oldData: null,

      newData:
        getProductAuditData(
          populatedProduct
        ),
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Product created successfully.",

      data: populatedProduct,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    await createAuditLog({
      req,

      action: "CREATE",

      description:
        "Failed to create product.",

      recordId: null,

      status: "FAILED",

      errorMessage:
        error.message,
    });

    // Duplicate key
    if (
      error.code === 11000
    ) {
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
        error.message,
    });
  }
};

// ======================================================
// GET PRODUCTS
// ======================================================

export const getProducts = async (
  req,
  res
) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    page =
      Math.max(
        Number(page) || 1,
        1
      );

    limit =
      Math.max(
        Number(limit) || 10,
        1
      );

    const skip =
      (page - 1) * limit;

    // ==================================================
    // SEARCH
    // ==================================================

    const filter = {};

    if (
      search &&
      search.trim()
    ) {
      const searchValue =
        search.trim();

      filter.$or = [
        {
          name: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          sku: {
            $regex:
              searchValue,
            $options: "i",
          },
        },
      ];
    }

    // ==================================================
    // QUERY
    // ==================================================

    const [
      products,
      total,
    ] = await Promise.all([
      Product.find(filter)
        .populate(
          "categories",
          "_id name description isActive"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(
        filter
      ),
    ]);

    // ==================================================
    // PAGINATION
    // ==================================================

    const totalPages =
      Math.ceil(
        total / limit
      );

    return res.status(200).json({
      success: true,

      message:
        "Products fetched successfully.",

      data: products,

      pagination: {
        page,

        limit,

        total,

        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load products.",

      error:
        error.message,
    });
  }
};

// ======================================================
// GET SINGLE PRODUCT
// ======================================================

export const getProductById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const product =
      await Product.findById(
        id
      ).populate(
        "categories",
        "_id name description isActive"
      );

    if (!product) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Product fetched successfully.",

      data: product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load product.",

      error:
        error.message,
    });
  }
};

// ======================================================
// UPDATE PRODUCT
// ======================================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      name,
      sku,
      description = "",
      price,
      stock = 0,
      categories = [],
      isActive = true,
    } = req.body;

    // ==================================================
    // FIND PRODUCT
    // ==================================================

    const existingProduct =
      await Product.findById(
        id
      ).populate(
        "categories",
        "_id name"
      );

    if (!existingProduct) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found.",
      });
    }

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !name ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Product name is required.",
      });
    }

    if (
      !sku ||
      !sku.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "SKU is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Please enter a valid price.",
      });
    }

    if (
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Stock cannot be negative.",
      });
    }

    // ==================================================
    // CATEGORY VALIDATION
    // ==================================================

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
        categories.map(
          (categoryId) =>
            String(categoryId)
        )
      ),
    ];

    const categoryDocuments =
      await Category.find({
        _id: {
          $in: uniqueCategoryIds,
        },

        isActive: true,
      }).select(
        "_id name"
      );

    if (
      categoryDocuments.length !==
      uniqueCategoryIds.length
    ) {
      return res.status(400).json({
        success: false,

        message:
          "One or more selected categories are invalid or inactive.",
      });
    }

    // ==================================================
    // CHECK DUPLICATE SKU
    // ==================================================

    const normalizedSku =
      sku
        .trim()
        .toUpperCase();

    const duplicateSku =
      await Product.findOne({
        sku: normalizedSku,

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

    // ==================================================
    // OLD DATA
    // ==================================================

    const oldData =
      getProductAuditData(
        existingProduct
      );

    // ==================================================
    // UPDATE
    // ==================================================

    existingProduct.name =
      name.trim();

    existingProduct.sku =
      normalizedSku;

    existingProduct.description =
      description.trim();

    existingProduct.price =
      Number(price);

    existingProduct.stock =
      Number(stock);

    existingProduct.categories =
      uniqueCategoryIds;

    existingProduct.isActive =
      Boolean(isActive);

    await existingProduct.save();

    // ==================================================
    // POPULATE UPDATED PRODUCT
    // ==================================================

    const updatedProduct =
      await Product.findById(
        id
      ).populate(
        "categories",
        "_id name description isActive"
      );

    // ==================================================
    // NEW DATA
    // ==================================================

    const newData =
      getProductAuditData(
        updatedProduct
      );

    // ==================================================
    // AUDIT LOG
    // ==================================================

    await createAuditLog({
      req,

      action: "UPDATE",

      description:
        `Product "${updatedProduct.name}" updated.`,

      recordId:
        updatedProduct._id,

      oldData,

      newData,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Product updated successfully.",

      data: updatedProduct,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    await createAuditLog({
      req,

      action: "UPDATE",

      description:
        "Failed to update product.",

      recordId:
        req.params?.id ||
        null,

      status: "FAILED",

      errorMessage:
        error.message,
    });

    if (
      error.code === 11000
    ) {
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
        error.message,
    });
  }
};

// ======================================================
// DELETE PRODUCT
// ======================================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // ==================================================
    // FIND PRODUCT
    // ==================================================

    const product =
      await Product.findById(
        id
      ).populate(
        "categories",
        "_id name"
      );

    if (!product) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found.",
      });
    }

    // ==================================================
    // OLD DATA
    // ==================================================

    const oldData =
      getProductAuditData(
        product
      );

    // ==================================================
    // DELETE
    // ==================================================

    await Product.findByIdAndDelete(
      id
    );

    // ==================================================
    // AUDIT LOG
    // ==================================================

    await createAuditLog({
      req,

      action: "DELETE",

      description:
        `Product "${product.name}" deleted.`,

      recordId:
        product._id,

      oldData,

      newData: null,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Product deleted successfully.",

      data: null,
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    await createAuditLog({
      req,

      action: "DELETE",

      description:
        "Failed to delete product.",

      recordId:
        req.params?.id ||
        null,

      status: "FAILED",

      errorMessage:
        error.message,
    });

    return res.status(500).json({
      success: false,

      message:
        "Unable to delete product.",

      error:
        error.message,
    });
  }
};

// ======================================================
// CHANGE PRODUCT STATUS
// ======================================================

export const changeProductStatus =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        isActive,
      } = req.body;

      // ================================================
      // VALIDATE STATUS
      // ================================================

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "isActive must be a boolean value.",
        });
      }

      // ================================================
      // FIND PRODUCT
      // ================================================

      const product =
        await Product.findById(
          id
        ).populate(
          "categories",
          "_id name"
        );

      if (!product) {
        return res.status(404).json({
          success: false,

          message:
            "Product not found.",
        });
      }

      // ================================================
      // OLD STATUS
      // ================================================

      const oldStatus =
        Boolean(
          product.isActive
        );

      // ================================================
      // NO CHANGE
      // ================================================

      if (
        oldStatus ===
        isActive
      ) {
        return res.status(200).json({
          success: true,

          message: isActive
            ? "Product is already active."
            : "Product is already inactive.",

          data: product,
        });
      }

      // ================================================
      // OLD DATA
      // ================================================

      const oldData =
        getProductAuditData(
          product
        );

      // ================================================
      // UPDATE STATUS
      // ================================================

      product.isActive =
        isActive;

      await product.save();

      // ================================================
      // NEW DATA
      // ================================================

      const updatedProduct =
        await Product.findById(
          id
        ).populate(
          "categories",
          "_id name"
        );

      const newData =
        getProductAuditData(
          updatedProduct
        );

      // ================================================
      // AUDIT LOG
      // ================================================

      await createAuditLog({
        req,

        action:
          "STATUS_UPDATE",

        description: isActive
          ? `Product "${updatedProduct.name}" activated.`
          : `Product "${updatedProduct.name}" deactivated.`,

        recordId:
          updatedProduct._id,

        oldData,

        newData,
      });

      // ================================================
      // RESPONSE
      // ================================================

      return res.status(200).json({
        success: true,

        message: isActive
          ? "Product activated successfully."
          : "Product deactivated successfully.",

        data:
          updatedProduct,
      });
    } catch (error) {
      console.error(
        "Change product status error:",
        error
      );

      await createAuditLog({
        req,

        action:
          "STATUS_UPDATE",

        description:
          "Failed to change product status.",

        recordId:
          req.params?.id ||
          null,

        status: "FAILED",

        errorMessage:
          error.message,
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to change product status.",

        error:
          error.message,
      });
    }
  };