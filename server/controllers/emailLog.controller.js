import EmailLog from "../models/emailLog.model.js";

/**
 * Get Email History
 */
export const getEmailLogs = async (
  req,
  res
) => {
  try {
    // =========================================
    // QUERY PARAMETERS
    // =========================================

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      fromDate = "",
      toDate = "",
      sentBy = "",
    } = req.query;

    // =========================================
    // PAGINATION
    // =========================================

    const currentPage =
      Math.max(Number(page), 1);

    const pageLimit =
      Math.min(
        Math.max(Number(limit), 1),
        100
      );

    const skip =
      (currentPage - 1) *
      pageLimit;

    // =========================================
    // BUILD FILTER
    // =========================================

    const filter = {};

    // =========================================
    // STATUS
    // =========================================

    if (status) {
      filter.status = status;
    }

    // =========================================
    // SENT BY
    // =========================================

    if (sentBy) {
      filter.sentBy = sentBy;
    }

    // =========================================
    // SEARCH
    // =========================================

    if (search.trim()) {
      const searchRegex =
        new RegExp(
          search.trim(),
          "i"
        );

      filter.$or = [
        {
          subject: searchRegex,
        },

        {
          message: searchRegex,
        },

        {
          to: searchRegex,
        },
      ];
    }

    // =========================================
    // DATE FILTER
    // =========================================

    if (
      fromDate ||
      toDate
    ) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte =
          new Date(
            `${fromDate}T00:00:00.000`
          );
      }

      if (toDate) {
        filter.createdAt.$lte =
          new Date(
            `${toDate}T23:59:59.999`
          );
      }
    }

    // =========================================
    // TOTAL COUNT
    // =========================================

    const total =
      await EmailLog.countDocuments(
        filter
      );

    // =========================================
    // FETCH EMAIL LOGS
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
        .skip(skip)
        .limit(pageLimit)
        .lean();

    // =========================================
    // TOTAL PAGES
    // =========================================

    const totalPages =
      Math.ceil(
        total / pageLimit
      );

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({
      success: true,

      data: logs,

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
      "Get email logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email history.",
    });
  }
};

/**
 * Get Single Email Log
 */
export const getEmailLogById = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const log =
      await EmailLog.findById(id)
        .populate(
          "sentBy",
          "name email role"
        )
        .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message:
          "Email log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error(
      "Get email log error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch email details.",
    });
  }
};