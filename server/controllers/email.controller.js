import emailService from "../services/email.service.js";
import EmailLog from "../models/emailLog.model.js";
import {replaceTemplateVariables,} from "../utils/replaceTemplateVariables.js";
import User from "../models/user.model.js";


export const sendEmail = async (req, res) => {
  try {
    const {
      recipients = [],
      to,
      cc = [],
      bcc = [],
      subject,
      message,
      html = "",
    } = req.body;

    // =====================================
    // PERSONALIZED RECIPIENT MODE
    // =====================================

    if (
      Array.isArray(recipients) &&
      recipients.length > 0
    ) {
      const cleanRecipients =
        recipients
          .filter(
            (recipient) =>
              recipient?.email?.trim()
          )
          .map((recipient) => ({
            email: recipient.email
              .trim()
              .toLowerCase(),

            subject:
              recipient.subject?.trim() ||
              "",

            message:
              recipient.message?.trim() ||
              "",

            html:
              recipient.html?.trim() ||
              "",
          }));

      // -------------------------------------
      // VALIDATE RECIPIENTS
      // -------------------------------------

      if (
        cleanRecipients.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient email is required.",
        });
      }

      // -------------------------------------
      // VALIDATE EACH RECIPIENT
      // -------------------------------------

      for (
        const recipient of cleanRecipients
      ) {
        if (
          !recipient.subject
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Email subject is required for ${recipient.email}.`,
          });
        }

        if (
          !recipient.message &&
          !recipient.html
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Email message is required for ${recipient.email}.`,
          });
        }
      }

      // -------------------------------------
      // NORMALIZE CC / BCC
      // -------------------------------------

      const cleanCc =
        Array.isArray(cc)
          ? cc
              .map((email) =>
                String(email)
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          : [];

      const cleanBcc =
        Array.isArray(bcc)
          ? bcc
              .map((email) =>
                String(email)
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          : [];

      // -------------------------------------
      // SEND PERSONALIZED EMAILS
      // -------------------------------------

      const results = [];

      let sentCount = 0;
      let failedCount = 0;

      for (
        const recipient of cleanRecipients
      ) {
        try {
          const finalHtml =
            recipient.html ||
            `
              <div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #334155;
              ">
                ${recipient.message.replace(
                  /\n/g,
                  "<br />"
                )}
              </div>
            `;

          const result =
            await emailService.sendEmail({
              to: [
                recipient.email,
              ],

              cc: cleanCc,

              bcc: cleanBcc,

              subject:
                recipient.subject,

              text:
                recipient.message,

              html:
                finalHtml,

              sentBy:
                req.user?._id,
            });

          sentCount++;

          results.push({
            email:
              recipient.email,

            status: "SENT",

            logId:
              result?.logId ||
              null,

            messageId:
              result?.messageId ||
              null,
          });

        } catch (error) {
          failedCount++;

          console.error(
            `Failed to send email to ${recipient.email}:`,
            error
          );

          results.push({
            email:
              recipient.email,

            status: "FAILED",

            error:
              error?.message ||
              "Unable to send email.",
          });
        }
      }

      // -------------------------------------
      // RESPONSE
      // -------------------------------------

      return res.status(200).json({
        success:
          failedCount === 0,

        message:
          failedCount === 0
            ? `Email sent successfully to ${sentCount} recipient(s).`
            : `Email sent to ${sentCount} recipient(s), ${failedCount} failed.`,

        summary: {
          total:
            cleanRecipients.length,

          sent:
            sentCount,

          failed:
            failedCount,
        },

        results,
      });
    }

    // =====================================
    // NORMAL EMAIL MODE
    // =====================================

    if (
      !to ||
      (Array.isArray(to) &&
        to.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient email is required.",
      });
    }

    // =====================================
    // VALIDATE SUBJECT
    // =====================================

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Email subject is required.",
      });
    }

    // =====================================
    // VALIDATE MESSAGE
    // =====================================

    if (
      !message?.trim() &&
      !html?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email message is required.",
      });
    }

    // =====================================
    // NORMALIZE RECIPIENTS
    // =====================================

    const cleanTo =
      Array.isArray(to)
        ? to
            .map((email) =>
              String(email)
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        : [
            String(to)
              .trim()
              .toLowerCase(),
          ];

    const cleanCc =
      Array.isArray(cc)
        ? cc
            .map((email) =>
              String(email)
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        : [];

    const cleanBcc =
      Array.isArray(bcc)
        ? bcc
            .map((email) =>
              String(email)
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        : [];

    // =====================================
    // SEND EMAIL
    // =====================================

    const result =
      await emailService.sendEmail({
        to: cleanTo,

        cc: cleanCc,

        bcc: cleanBcc,

        subject:
          subject.trim(),

        text:
          message?.trim() || "",

        html:
          html?.trim() ||
          `
            <div style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
            ">
              ${message
                ?.trim()
                .replace(
                  /\n/g,
                  "<br />"
                )}
            </div>
          `,

        sentBy:
          req.user?._id,
      });

    // =====================================
    // SUCCESS
    // =====================================

    return res.status(200).json({
      success: true,

      message:
        "Email sent successfully.",

      data: result,
    });

  } catch (error) {
    console.error(
      "Send email controller error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to send email.",
    });
  }
};


/**
 * GET /api/email/logs
 * Get email logs with pagination and filters
 */
export const getEmailLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
    } = req.query;

    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit =
      Math.min(
        Math.max(Number(limit), 1),
        100
      );

    // =========================================
    // BUILD FILTER
    // =========================================

    const filter = {};

    // Status filter
    if (status && status !== "ALL") {
      filter.status = status;
    }

    // Search filter
    if (search?.trim()) {
      const searchText =
        search.trim();

      filter.$or = [
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
        {
          to: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte =
          new Date(
            `${startDate}T00:00:00.000Z`
          );
      }

      if (endDate) {
        filter.createdAt.$lte =
          new Date(
            `${endDate}T23:59:59.999Z`
          );
      }
    }

    // =========================================
    // COUNT
    // =========================================

    const total =
      await EmailLog.countDocuments(
        filter
      );

    // =========================================
    // FETCH LOGS
    // =========================================

    const logs =
      await EmailLog.find(filter)
        .populate(
          "sentBy",
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

    // =========================================
    // PAGINATION
    // =========================================

    const totalPages =
      Math.ceil(
        total / pageLimit
      );

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages,

        hasNextPage:
          currentPage < totalPages,

        hasPreviousPage:
          currentPage > 1,
      },
    });

  } catch (error) {

    console.error(
      "Get email logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email logs.",
    });
  }
};


/**
 * GET /api/email/logs/:id
 * Get single email log details
 */
export const getEmailLogById = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------
    // Validate ID
    // -----------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Email log ID is required.",
      });
    }

    // -----------------------------------------
    // Find Email Log
    // -----------------------------------------

    const emailLog = await EmailLog.findById(id)
      .populate(
        "sentBy",
        "name email role"
      )
      .lean();

    // -----------------------------------------
    // Not Found
    // -----------------------------------------

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: "Email log not found.",
      });
    }

    // -----------------------------------------
    // Success
    // -----------------------------------------

    return res.status(200).json({
      success: true,
      message: "Email log fetched successfully.",
      data: emailLog,
    });

  } catch (error) {
    console.error(
      "Get email log error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email log.",
    });
  }
};

/**
 * POST /api/email/logs/:id/resend
 * Resend an existing email
 */
export const resendEmail = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------
    // Validate ID
    // -----------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Email log ID is required.",
      });
    }

    // -----------------------------------------
    // Find existing email log
    // -----------------------------------------

    const emailLog =
      await EmailLog.findById(id);

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        message: "Email log not found.",
      });
    }

    // -----------------------------------------
    // Only allow resend for failed emails
    // -----------------------------------------

    if (emailLog.status !== "FAILED") {
      return res.status(400).json({
        success: false,
        message:
          "Only failed emails can be resent.",
      });
    }

    // -----------------------------------------
    // Mark as PENDING
    // -----------------------------------------

    emailLog.status = "PENDING";
    emailLog.errorMessage = null;

    await emailLog.save();

    // -----------------------------------------
    // Send email again
    // -----------------------------------------

    try {
      const result =
        await emailService.sendEmail({
          to: emailLog.to,
          cc: emailLog.cc || [],
          bcc: emailLog.bcc || [],

          subject:
            emailLog.subject,

          text:
            emailLog.message,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
            ">
              ${emailLog.message
                .replace(/\n/g, "<br />")}
            </div>
          `,

          sentBy:
            req.user?._id,

          // IMPORTANT
          // Tell emailService this is
          // an existing log.
          emailLogId:
            emailLog._id,
        });

      // ---------------------------------------
      // Success
      // ---------------------------------------

      return res.status(200).json({
        success: true,
        message:
          "Email resent successfully.",
        data: result,
      });

    } catch (sendError) {

      console.error(
        "Resend email error:",
        sendError
      );

      // ---------------------------------------
      // Mark FAILED
      // ---------------------------------------

      emailLog.status = "FAILED";

      emailLog.errorMessage =
        sendError?.message ||
        "Unable to resend email.";

      await emailLog.save();

      return res.status(500).json({
        success: false,
        message:
          sendError?.message ||
          "Unable to resend email.",
      });
    }

  } catch (error) {

    console.error(
      "Resend email controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to resend email.",
    });
  }
};

/**
 * POST /api/email/send-personalized
 *
 * Send personalized template email
 * to multiple users.
 */
export const sendPersonalizedEmail = async (
  req,
  res
) => {
  try {
    const {
      userIds = [],
      subject,
      message,
      html = "",
      cc = [],
      bcc = [],
    } = req.body;

    // =========================================
    // VALIDATION
    // =========================================

    if (
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least one user.",
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Email subject is required.",
      });
    }

    if (
      !message?.trim() &&
      !html?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email message is required.",
      });
    }

    // =========================================
    // LOAD USERS
    // =========================================

    const users = await User.find({
      _id: {
        $in: userIds,
      },
      isActive: true,
    }).select(
      "_id name email role company"
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message:
          "No active users found.",
      });
    }

    // =========================================
    // NORMALIZE CC / BCC
    // =========================================

    const cleanCc = Array.isArray(cc)
      ? cc
          .map((email) =>
            String(email)
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      : [];

    const cleanBcc = Array.isArray(bcc)
      ? bcc
          .map((email) =>
            String(email)
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      : [];

    // =========================================
    // RESULTS
    // =========================================

    const results = [];

    let sentCount = 0;
    let failedCount = 0;

    // =========================================
    // SEND PERSONALIZED EMAIL
    // =========================================

    for (const user of users) {
      try {
        // ---------------------------------------
        // Replace variables in SUBJECT
        // ---------------------------------------

        const personalizedSubject =
          replaceTemplateVariables(
            subject.trim(),
            user
          );

        // ---------------------------------------
        // Replace variables in MESSAGE
        // ---------------------------------------

        const personalizedMessage =
          replaceTemplateVariables(
            message?.trim() || "",
            user
          );

        // ---------------------------------------
        // Replace variables in HTML
        // ---------------------------------------

        const defaultHtml = `
          <div style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
          ">
            ${personalizedMessage
              .replace(/\n/g, "<br />")}
          </div>
        `;

        const personalizedHtml =
          replaceTemplateVariables(
            html?.trim() ||
              defaultHtml,
            user
          );

        // ---------------------------------------
        // SEND EMAIL
        // ---------------------------------------

        const result =
          await emailService.sendEmail({
            to: [user.email],

            cc: cleanCc,

            bcc: cleanBcc,

            subject:
              personalizedSubject,

            text:
              personalizedMessage,

            html:
              personalizedHtml,

            sentBy:
              req.user?._id,
          });

        sentCount++;

        results.push({
          userId: user._id,
          name: user.name,
          email: user.email,

          status: "SENT",

          logId:
            result?.logId || null,

          messageId:
            result?.messageId || null,
        });

      } catch (error) {
        failedCount++;

        console.error(
          `Failed to send email to ${user.email}:`,
          error
        );

        results.push({
          userId: user._id,
          name: user.name,
          email: user.email,

          status: "FAILED",

          error:
            error?.message ||
            "Unable to send email.",
        });
      }
    }

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({
      success: failedCount === 0,

      message:
        failedCount === 0
          ? `Email sent successfully to ${sentCount} user(s).`
          : `Email sent to ${sentCount} user(s), ${failedCount} failed.`,

      summary: {
        total: users.length,
        sent: sentCount,
        failed: failedCount,
      },

      results,
    });

  } catch (error) {
    console.error(
      "Send personalized email error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to send personalized emails.",
    });
  }
};