import mongoose from "mongoose";

import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";

// ==========================================================
// GET AUDIT LOGS
// ==========================================================

export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      user = "",
      module = "",
      action = "",
      status = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;

    // ======================================================
    // PAGINATION
    // ======================================================

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const currentLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip =
      (currentPage - 1) * currentLimit;

    // ======================================================
    // BASE FILTER
    // ======================================================

    const filter = {};

    // ======================================================
    // MODULE
    // ======================================================

    if (module.trim()) {
      filter.module = module.trim();
    }

    // ======================================================
    // ACTION
    // ======================================================

    if (action.trim()) {
      filter.action = action.trim();
    }

    // ======================================================
    // STATUS
    // ======================================================

    if (status.trim()) {
      filter.status = status.trim();
    }

    // ======================================================
    // DATE FILTER
    // ======================================================

    if (
      dateFrom.trim() ||
      dateTo.trim()
    ) {
      filter.createdAt = {};

      // ----------------------------------------------------
      // FROM DATE
      // ----------------------------------------------------

      if (dateFrom.trim()) {
        const fromDate = new Date(
          `${dateFrom.trim()}T00:00:00.000`
        );

        if (
          !Number.isNaN(
            fromDate.getTime()
          )
        ) {
          filter.createdAt.$gte =
            fromDate;
        }
      }

      // ----------------------------------------------------
      // TO DATE
      // ----------------------------------------------------

      if (dateTo.trim()) {
        const toDate = new Date(
          `${dateTo.trim()}T23:59:59.999`
        );

        if (
          !Number.isNaN(
            toDate.getTime()
          )
        ) {
          filter.createdAt.$lte =
            toDate;
        }
      }

      // ----------------------------------------------------
      // Remove empty createdAt object
      // ----------------------------------------------------

      if (
        Object.keys(
          filter.createdAt
        ).length === 0
      ) {
        delete filter.createdAt;
      }
    }

    // ======================================================
    // USER FILTER
    //
    // Supports:
    // - User MongoDB ID
    // - User name
    // - User email
    // ======================================================

    if (user.trim()) {
      const userSearch =
        user.trim();

      // ----------------------------------------------------
      // USER ID
      // ----------------------------------------------------

      if (
        mongoose.Types.ObjectId.isValid(
          userSearch
        )
      ) {
        filter.user =
          new mongoose.Types.ObjectId(
            userSearch
          );
      } else {
        // --------------------------------------------------
        // USER NAME / EMAIL
        // --------------------------------------------------

        const matchingUsers =
          await User.find({
            $or: [
              {
                name: {
                  $regex: userSearch,
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: userSearch,
                  $options: "i",
                },
              },
            ],
          })
            .select("_id")
            .lean();

        const userIds =
          matchingUsers.map(
            (item) => item._id
          );

        // --------------------------------------------------
        // No matching users
        // --------------------------------------------------

        if (userIds.length === 0) {
          return res.status(200).json({
            success: true,

            data: [],

            pagination: {
              page: currentPage,
              limit: currentLimit,
              total: 0,
              totalPages: 0,
            },
          });
        }

        filter.user = {
          $in: userIds,
        };
      }
    }

    // ======================================================
    // GENERAL SEARCH
    // ======================================================

    if (search.trim()) {
      const searchValue =
        search.trim();

      const searchConditions = [
        // Description
        {
          description: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // Endpoint
        {
          endpoint: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // HTTP Method
        {
          method: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // IP Address
        {
          ipAddress: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // User Agent
        {
          userAgent: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // Record ID
        {
          recordId: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // User name if stored directly
        {
          userName: {
            $regex: searchValue,
            $options: "i",
          },
        },

        // User email if stored directly
        {
          userEmail: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];

      // ----------------------------------------------------
      // Search by User ObjectId
      // ----------------------------------------------------

      if (
        mongoose.Types.ObjectId.isValid(
          searchValue
        )
      ) {
        searchConditions.push({
          user: new mongoose.Types.ObjectId(
            searchValue
          ),
        });
      }

      filter.$or =
        searchConditions;
    }

    // ======================================================
    // DEBUG
    // ======================================================

    console.log(
      "Audit Log Filter:",
      JSON.stringify(
        filter,
        null,
        2
      )
    );

    // ======================================================
    // FETCH DATA
    // ======================================================

    const [logs, total] =
      await Promise.all([
        AuditLog.find(filter)
          .populate(
            "user",
            "name email"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(currentLimit)
          .lean(),

        AuditLog.countDocuments(
          filter
        ),
      ]);

    // ======================================================
    // PAGINATION
    // ======================================================

    const totalPages =
      Math.ceil(
        total / currentLimit
      );

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    // ======================================================
    // ERROR
    // ======================================================

    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch audit logs",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};