import mongoose from "mongoose";
import EmailTemplate from "../models/emailTemplate.model.js";

/**
 * =========================================
 * CREATE EMAIL TEMPLATE
 * POST /api/email/templates
 * =========================================
 */
export const createTemplate = async (req, res) => {
  try {
    const {
      name,
      subject,
      message = "",
      html = "",
      status = "ACTIVE",
    } = req.body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name is required.",
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template subject is required.",
      });
    }

    // -----------------------------------------
    // VALIDATE STATUS
    // -----------------------------------------

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template status.",
      });
    }

    // -----------------------------------------
    // CHECK DUPLICATE NAME
    // -----------------------------------------

    const existingTemplate =
      await EmailTemplate.findOne({
        name: name.trim(),
      });

    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message:
          "A template with this name already exists.",
      });
    }

    // -----------------------------------------
    // CREATE TEMPLATE
    // -----------------------------------------

    const template =
      await EmailTemplate.create({
        name: name.trim(),
        subject: subject.trim(),
        message: message || "",
        html: html || "",
        status,

        createdBy:
          req.user?._id || null,

        updatedBy:
          req.user?._id || null,
      });

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Email template created successfully.",
      data: template,
    });
  } catch (error) {
    console.error(
      "Create email template error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create email template.",
    });
  }
};


/**
 * =========================================
 * GET EMAIL TEMPLATES
 * GET /api/email/templates
 *
 * Supports:
 * page
 * limit
 * search
 * status
 * =========================================
 */
export const getTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "ALL",
    } = req.query;

    // -----------------------------------------
    // PAGINATION
    // -----------------------------------------

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const pageLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 10,
        1
      ),
      100
    );

    // -----------------------------------------
    // BUILD FILTER
    // -----------------------------------------

    const filter = {};

    // Status filter
    if (
      status &&
      status !== "ALL"
    ) {
      if (
        !["ACTIVE", "INACTIVE"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid template status.",
        });
      }

      filter.status = status;
    }

    // Search filter
    if (search?.trim()) {
      const searchText =
        search.trim();

      filter.$or = [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          message: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    // -----------------------------------------
    // TOTAL COUNT
    // -----------------------------------------

    const total =
      await EmailTemplate.countDocuments(
        filter
      );

    // -----------------------------------------
    // FETCH TEMPLATES
    // -----------------------------------------

    const templates =
      await EmailTemplate.find(filter)
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "updatedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (currentPage - 1) *
            pageLimit
        )
        .limit(pageLimit)
        .lean();

    // -----------------------------------------
    // PAGINATION
    // -----------------------------------------

    const totalPages =
      Math.ceil(
        total / pageLimit
      );

    return res.status(200).json({
      success: true,
      data: templates,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages,

        hasNextPage:
          currentPage <
          totalPages,

        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get email templates error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email templates.",
    });
  }
};


/**
 * =========================================
 * GET EMAIL TEMPLATE BY ID
 * GET /api/email/templates/:id
 * =========================================
 */
export const getTemplateById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // -----------------------------------------
    // VALIDATE ID
    // -----------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email template ID.",
      });
    }

    // -----------------------------------------
    // FIND TEMPLATE
    // -----------------------------------------

    const template =
      await EmailTemplate.findById(id)
        .populate(
          "createdBy",
          "name email role"
        )
        .populate(
          "updatedBy",
          "name email role"
        )
        .lean();

    // -----------------------------------------
    // NOT FOUND
    // -----------------------------------------

    if (!template) {
      return res.status(404).json({
        success: false,
        message:
          "Email template not found.",
      });
    }

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Email template fetched successfully.",
      data: template,
    });
  } catch (error) {
    console.error(
      "Get email template error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email template.",
    });
  }
};


/**
 * =========================================
 * UPDATE EMAIL TEMPLATE
 * PUT /api/email/templates/:id
 * =========================================
 */
export const updateTemplate = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      subject,
      message,
      html,
      status,
    } = req.body;

    // -----------------------------------------
    // VALIDATE ID
    // -----------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email template ID.",
      });
    }

    // -----------------------------------------
    // FIND TEMPLATE
    // -----------------------------------------

    const template =
      await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message:
          "Email template not found.",
      });
    }

    // -----------------------------------------
    // VALIDATE NAME
    // -----------------------------------------

    if (
      name !== undefined &&
      !name?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Template name is required.",
      });
    }

    // -----------------------------------------
    // VALIDATE SUBJECT
    // -----------------------------------------

    if (
      subject !== undefined &&
      !subject?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Template subject is required.",
      });
    }

    // -----------------------------------------
    // VALIDATE STATUS
    // -----------------------------------------

    if (
      status !== undefined &&
      !["ACTIVE", "INACTIVE"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid template status.",
      });
    }

    // -----------------------------------------
    // CHECK DUPLICATE NAME
    // -----------------------------------------

    if (
      name !== undefined &&
      name.trim() !== template.name
    ) {
      const existingTemplate =
        await EmailTemplate.findOne({
          name: name.trim(),
          _id: {
            $ne: id,
          },
        });

      if (existingTemplate) {
        return res.status(409).json({
          success: false,
          message:
            "A template with this name already exists.",
        });
      }
    }

    // -----------------------------------------
    // UPDATE FIELDS
    // -----------------------------------------

    if (name !== undefined) {
      template.name =
        name.trim();
    }

    if (subject !== undefined) {
      template.subject =
        subject.trim();
    }

    if (message !== undefined) {
      template.message =
        message;
    }

    if (html !== undefined) {
      template.html =
        html;
    }

    if (status !== undefined) {
      template.status =
        status;
    }

    template.updatedBy =
      req.user?._id || null;

    // -----------------------------------------
    // SAVE
    // -----------------------------------------

    await template.save();

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Email template updated successfully.",
      data: template,
    });
  } catch (error) {
    console.error(
      "Update email template error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update email template.",
    });
  }
};


/**
 * =========================================
 * DELETE EMAIL TEMPLATE
 * DELETE /api/email/templates/:id
 * =========================================
 */
export const deleteTemplate = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // -----------------------------------------
    // VALIDATE ID
    // -----------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email template ID.",
      });
    }

    // -----------------------------------------
    // FIND TEMPLATE
    // -----------------------------------------

    const template =
      await EmailTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message:
          "Email template not found.",
      });
    }

    // -----------------------------------------
    // DELETE
    // -----------------------------------------

    await EmailTemplate.findByIdAndDelete(
      id
    );

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Email template deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete email template error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete email template.",
    });
  }
};


/**
 * =========================================
 * UPDATE TEMPLATE STATUS
 * PATCH /api/email/templates/:id/status
 * =========================================
 */
export const updateTemplateStatus =
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // -----------------------------------------
      // VALIDATE ID
      // -----------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid email template ID.",
        });
      }

      // -----------------------------------------
      // VALIDATE STATUS
      // -----------------------------------------

      if (
        !["ACTIVE", "INACTIVE"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be ACTIVE or INACTIVE.",
        });
      }

      // -----------------------------------------
      // FIND TEMPLATE
      // -----------------------------------------

      const template =
        await EmailTemplate.findById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Email template not found.",
        });
      }

      // -----------------------------------------
      // UPDATE STATUS
      // -----------------------------------------

      template.status = status;

      template.updatedBy =
        req.user?._id || null;

      await template.save();

      // -----------------------------------------
      // SUCCESS
      // -----------------------------------------

      return res.status(200).json({
        success: true,
        message:
          `Template ${
            status === "ACTIVE"
              ? "activated"
              : "deactivated"
          } successfully.`,
        data: template,
      });
    } catch (error) {
      console.error(
        "Update email template status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update template status.",
      });
    }
  };