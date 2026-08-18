import {
  getDashboardData,
} from "../services/dashboard.service.js";

// ==========================================================
// GET DASHBOARD
// ==========================================================

export const getDashboard = async (
  req,
  res
) => {
  try {
    const dashboard =
      await getDashboardData();

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error(
      "Get dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load dashboard data.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};