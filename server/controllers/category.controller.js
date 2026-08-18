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
    const user = req.user || null;

    await AuditLog.create({
      // ------------------------------------------
      // USER
      // ------------------------------------------

      user: user?._id || null,

      userName:
        user?.name ||
        user?.username ||
        null,

      userEmail:
        user?.email ||
        null,

      // ------------------------------------------
      // ACTION
      // ------------------------------------------

      action,

      module: "CATEGORY",

      description,

      recordId,

      // ------------------------------------------
      // DATA
      // ------------------------------------------

      oldData,

      newData,

      // ------------------------------------------
      // REQUEST
      // ------------------------------------------

      method:
        req.method || null,

      endpoint:
        req.originalUrl ||
        req.url ||
        null,

      ipAddress:
        req.ip ||
        req.headers?.["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

      userAgent:
        req.headers?.["user-agent"] ||
        null,

      // ------------------------------------------
      // STATUS
      // ------------------------------------------

      status,

      errorMessage,
    });
  } catch (auditError) {
    // Audit failure should NEVER break
    // the main category operation.

    console.error(
      "Audit log error:",
      auditError
    );
  }
};

// ==========================================
// CREATE CATEGORY
// ==========================================

export const createCategory = async (
  req,
  res
) => {
  try {
    const {
      name,
      description = "",
      isActive = true,
    } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Category name is required.",
      });
    }

    // ----------------------------------------
    // CHECK DUPLICATE
    // ----------------------------------------

    const existingCategory =
      await Category.findOne({
        name: {
          $regex: `^${name.trim()}$`,
          $options: "i",
        },
      });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message:
          "Category already exists.",
      });
    }

    // ----------------------------------------
    // CREATE
    // ----------------------------------------

    const category =
      await Category.create({
        name: name.trim(),

        description:
          description?.trim() || "",

        isActive,

        createdBy:
          req.user?._id || null,

        updatedBy:
          req.user?._id || null,
      });

    // ----------------------------------------
    // AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "CREATE",

      description:
        `Created category "${category.name}"`,

      recordId: category._id,

      oldData: null,

      newData: {
        name: category.name,
        description:
          category.description,
        isActive:
          category.isActive,
      },
    });

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Category created successfully.",

      data: category,
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error
    );

    // ----------------------------------------
    // FAILED AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "CREATE",

      description:
        "Failed to create category.",

      status: "FAILED",

      errorMessage:
        error?.message ||
        "Unknown error",
    });

    // ----------------------------------------
    // DUPLICATE KEY
    // ----------------------------------------

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Category already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to create category.",
    });
  }
};

// ==========================================
// GET ALL CATEGORIES
// ==========================================

export const getCategories = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status = "ALL",
    } = req.query;

    const filter = {};

    // ----------------------------------------
    // STATUS
    // ----------------------------------------

    if (status === "ACTIVE") {
      filter.isActive = true;
    }

    if (status === "INACTIVE") {
      filter.isActive = false;
    }

    // ----------------------------------------
    // SEARCH
    // ----------------------------------------

    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const categories =
      await Category.find(filter)
        .populate(
          "createdBy",
          "name email"
        )
        .populate(
          "updatedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch categories.",
    });
  }
};

// ==========================================
// GET CATEGORY BY ID
// ==========================================

export const getCategoryById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Category ID is required.",
      });
    }

    const category =
      await Category.findById(id)
        .populate(
          "createdBy",
          "name email"
        )
        .populate(
          "updatedBy",
          "name email"
        )
        .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch category.",
    });
  }
};

// ==========================================
// UPDATE CATEGORY
// ==========================================

export const updateCategory = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Category ID is required.",
      });
    }

    const category =
      await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found.",
      });
    }

    // ----------------------------------------
    // CAPTURE OLD DATA
    // ----------------------------------------

    const oldData = {
      name: category.name,
      description:
        category.description,
      isActive:
        category.isActive,
    };

    // ----------------------------------------
    // UPDATE NAME
    // ----------------------------------------

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Category name is required.",
        });
      }

      const duplicate =
        await Category.findOne({
          _id: {
            $ne: id,
          },

          name: {
            $regex:
              `^${name.trim()}$`,

            $options: "i",
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Category already exists.",
        });
      }

      category.name =
        name.trim();
    }

    // ----------------------------------------
    // UPDATE DESCRIPTION
    // ----------------------------------------

    if (description !== undefined) {
      category.description =
        description.trim();
    }

    // ----------------------------------------
    // UPDATE STATUS
    // ----------------------------------------

    if (isActive !== undefined) {
      category.isActive =
        isActive;
    }

    // ----------------------------------------
    // UPDATED BY
    // ----------------------------------------

    category.updatedBy =
      req.user?._id || null;

    await category.save();

    // ----------------------------------------
    // CAPTURE NEW DATA
    // ----------------------------------------

    const newData = {
      name: category.name,
      description:
        category.description,
      isActive:
        category.isActive,
    };

    // ----------------------------------------
    // AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "UPDATE",

      description:
        `Updated category "${category.name}"`,

      recordId: category._id,

      oldData,

      newData,
    });

    return res.status(200).json({
      success: true,

      message:
        "Category updated successfully.",

      data: category,
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error
    );

    // ----------------------------------------
    // FAILED AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "UPDATE",

      description:
        "Failed to update category.",

      status: "FAILED",

      errorMessage:
        error?.message ||
        "Unknown error",
    });

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Category already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to update category.",
    });
  }
};

// ==========================================
// DELETE CATEGORY
// ==========================================

export const deleteCategory = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Category ID is required.",
      });
    }

    const category =
      await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found.",
      });
    }

    // ----------------------------------------
    // CAPTURE DATA BEFORE DELETE
    // ----------------------------------------

    const oldData = {
      name: category.name,
      description:
        category.description,
      isActive:
        category.isActive,
    };

    const categoryId =
      category._id;

    const categoryName =
      category.name;

    // ----------------------------------------
    // DELETE
    // ----------------------------------------

    await Category.findByIdAndDelete(id);

    // ----------------------------------------
    // AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "DELETE",

      description:
        `Deleted category "${categoryName}"`,

      recordId:
        categoryId,

      oldData,

      newData: null,
    });

    return res.status(200).json({
      success: true,

      message:
        "Category deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    // ----------------------------------------
    // FAILED AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "DELETE",

      description:
        "Failed to delete category.",

      status: "FAILED",

      errorMessage:
        error?.message ||
        "Unknown error",
    });

    return res.status(500).json({
      success: false,

      message:
        "Unable to delete category.",
    });
  }
};

// ==========================================
// UPDATE CATEGORY STATUS
// ==========================================
// PATCH /api/categories/:id/status
// ==========================================

export const updateCategoryStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { isActive } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Category ID is required.",
      });
    }

    if (
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be a boolean value.",
      });
    }

    // ----------------------------------------
    // FIND CATEGORY
    // ----------------------------------------

    const category =
      await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found.",
      });
    }

    // ----------------------------------------
    // OLD DATA
    // ----------------------------------------

    const oldData = {
      isActive:
        category.isActive,
    };

    // ----------------------------------------
    // UPDATE STATUS
    // ----------------------------------------

    category.isActive =
      isActive;

    category.updatedBy =
      req.user?._id || null;

    await category.save();

    // ----------------------------------------
    // NEW DATA
    // ----------------------------------------

    const newData = {
      isActive:
        category.isActive,
    };

    // ----------------------------------------
    // AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "STATUS_UPDATE",

      description:
        `${
          isActive
            ? "Activated"
            : "Deactivated"
        } category "${category.name}"`,

      recordId:
        category._id,

      oldData,

      newData,
    });

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(200).json({
      success: true,

      message:
        `Category ${
          isActive
            ? "activated"
            : "deactivated"
        } successfully.`,

      data: category,
    });
  } catch (error) {
    console.error(
      "Update category status error:",
      error
    );

    // ----------------------------------------
    // FAILED AUDIT LOG
    // ----------------------------------------

    await createAuditLog({
      req,

      action: "STATUS_UPDATE",

      description:
        "Failed to update category status.",

      status: "FAILED",

      errorMessage:
        error?.message ||
        "Unknown error",
    });

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to update category status.",
    });
  }
};