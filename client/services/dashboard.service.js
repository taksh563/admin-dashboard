import api from "../api/axios";

// ==========================================================
// DASHBOARD SERVICE
// ==========================================================

const dashboardService = {
  // --------------------------------------------------------
  // GET DASHBOARD
  // --------------------------------------------------------

  getDashboard: async () => {
    const response =
      await api.get(
        "/dashboard"
      );

    return response.data;
  },
};

export default dashboardService;