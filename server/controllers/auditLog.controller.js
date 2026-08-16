import AuditLog from "../models/auditLog.model.js";

export const getAuditLogs = async (
  req,
  res
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      user,
      module,
      action,
      status,
      dateFrom,
      dateTo,
    } = req.query;

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

    const filter = {};

    // -----------------------------------------
    // User filter
    // -----------------------------------------

    if (user) {
      filter.user = user;
    }

    // -----------------------------------------
    // Module filter
    // -----------------------------------------

    if (module) {
      filter.module = module;
    }

    // -----------------------------------------
    // Action filter
    // -----------------------------------------

    if (action) {
      filter.action = action;
    }

    // -----------------------------------------
    // Status filter
    // -----------------------------------------

    if (status) {
      filter.status = status;
    }

    // -----------------------------------------
    // Search
    // -----------------------------------------

    if (search.trim()) {
      filter.$or = [
        {
          userName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          userEmail: {
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
        {
          endpoint: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // -----------------------------------------
    // Date filter
    // -----------------------------------------

    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        filter.createdAt.$gte =
          new Date(`${dateFrom}T00:00:00.000Z`);
      }

      if (dateTo) {
        filter.createdAt.$lte =
          new Date(`${dateTo}T23:59:59.999Z`);
      }
    }

    // -----------------------------------------
    // Query
    // -----------------------------------------

    const [logs, total] =
      await Promise.all([
        AuditLog.find(filter)
          .populate(
            "user",
            "name email role"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageLimit)
          .lean(),

        AuditLog.countDocuments(
          filter
        ),
      ]);

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
      },
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch audit logs",
    });
  }
};