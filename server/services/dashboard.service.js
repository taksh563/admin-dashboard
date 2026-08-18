import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import AuditLog from "../models/auditLog.model.js";

// ==========================================================
// DATE HELPERS
// ==========================================================

const getMonthRange = (offset = 0) => {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth() + offset,
    1
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + offset + 1,
    1
  );

  return {
    start,
    end,
  };
};

// ==========================================================
// CALCULATE PERCENTAGE CHANGE
// ==========================================================

const calculateGrowth = (
  current,
  previous
) => {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return Number(
    (
      ((current - previous) /
        previous) *
      100
    ).toFixed(1)
  );
};

// ==========================================================
// GET MONTHLY COUNT
// ==========================================================

const getMonthlyCount = async (
  Model,
  start,
  end
) => {
  return Model.countDocuments({
    createdAt: {
      $gte: start,
      $lt: end,
    },
  });
};

// ==========================================================
// GET DASHBOARD STATISTICS
// ==========================================================

export const getDashboardStatistics =
  async () => {
    // ------------------------------------------------------
    // TOTAL COUNTS
    // ------------------------------------------------------

    const [
      totalUsers,
      totalProducts,
      totalCategories,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
    ]);

    // ------------------------------------------------------
    // CURRENT MONTH
    // ------------------------------------------------------

    const currentMonth =
      getMonthRange(0);

    // ------------------------------------------------------
    // PREVIOUS MONTH
    // ------------------------------------------------------

    const previousMonth =
      getMonthRange(-1);

    // ------------------------------------------------------
    // CURRENT MONTH COUNTS
    // ------------------------------------------------------

    const [
      currentUsers,
      currentProducts,
      currentCategories,
    ] = await Promise.all([
      getMonthlyCount(
        User,
        currentMonth.start,
        currentMonth.end
      ),

      getMonthlyCount(
        Product,
        currentMonth.start,
        currentMonth.end
      ),

      getMonthlyCount(
        Category,
        currentMonth.start,
        currentMonth.end
      ),
    ]);

    // ------------------------------------------------------
    // PREVIOUS MONTH COUNTS
    // ------------------------------------------------------

    const [
      previousUsers,
      previousProducts,
      previousCategories,
    ] = await Promise.all([
      getMonthlyCount(
        User,
        previousMonth.start,
        previousMonth.end
      ),

      getMonthlyCount(
        Product,
        previousMonth.start,
        previousMonth.end
      ),

      getMonthlyCount(
        Category,
        previousMonth.start,
        previousMonth.end
      ),
    ]);

    // ------------------------------------------------------
    // GROWTH
    // ------------------------------------------------------

    const usersGrowth =
      calculateGrowth(
        currentUsers,
        previousUsers
      );

    const productsGrowth =
      calculateGrowth(
        currentProducts,
        previousProducts
      );

    const categoriesGrowth =
      calculateGrowth(
        currentCategories,
        previousCategories
      );

    // ------------------------------------------------------
    // RETURN
    // ------------------------------------------------------

    return {
      users: {
        total: totalUsers,
        currentMonth: currentUsers,
        previousMonth: previousUsers,
        growth: usersGrowth,
      },

      products: {
        total: totalProducts,
        currentMonth: currentProducts,
        previousMonth: previousProducts,
        growth: productsGrowth,
      },

      categories: {
        total: totalCategories,
        currentMonth:
          currentCategories,
        previousMonth:
          previousCategories,
        growth: categoriesGrowth,
      },

      revenue: {
        total: 0,
        growth: 0,
        available: false,
        message:
          "Revenue will be available after the Order/Sales module is added.",
      },
    };
  };

// ==========================================================
// GET RECENT ACTIVITY
// ==========================================================

export const getRecentActivity =
  async (limit = 8) => {
    const logs =
      await AuditLog.find({})
        .populate(
          "user",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    return logs.map((log) => ({
      _id: log._id,

      title:
        log.description ||
        `${log.action || "Activity"} ${
          log.module || ""
        }`,

      description:
        log.description ||
        `${log.action || ""} ${
          log.module || ""
        }`,

      action:
        log.action || "OTHER",

      module:
        log.module || "OTHER",

      status:
        log.status || "SUCCESS",

      userName:
        log.userName ||
        log.user?.name ||
        "System",

      userEmail:
        log.userEmail ||
        log.user?.email ||
        "",

      endpoint:
        log.endpoint || "",

      createdAt:
        log.createdAt,
    }));
  };

// ==========================================================
// GET DASHBOARD DATA
// ==========================================================

export const getDashboardData =
  async () => {
    const [
      statistics,
      recentActivity,
    ] = await Promise.all([
      getDashboardStatistics(),
      getRecentActivity(8),
    ]);

    return {
      statistics,
      recentActivity,
    };
  };