import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const code =
      error.response?.data?.code;

    const requestUrl =
      error.config?.url || "";

    // -----------------------------------------
    // Don't handle login 401 here
    // Login page handles these messages
    // -----------------------------------------

    const isLoginRequest =
      requestUrl.includes(
        "/auth/login"
      );

    if (
      status === 401 &&
      !isLoginRequest
    ) {
      // ---------------------------------------
      // TOKEN EXPIRED
      // ---------------------------------------

      if (code === "TOKEN_EXPIRED") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Store message temporarily
        sessionStorage.setItem(
          "sessionMessage",
          "Your session has expired. Please login again."
        );

        window.location.href =
          "/login";

        return Promise.reject(error);
      }

      // ---------------------------------------
      // INVALID TOKEN
      // ---------------------------------------

      if (code === "INVALID_TOKEN") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem(
          "sessionMessage",
          "Your session is invalid. Please login again."
        );

        window.location.href =
          "/login";

        return Promise.reject(error);
      }

      // ---------------------------------------
      // USER NOT FOUND
      // ---------------------------------------

      if (code === "USER_NOT_FOUND") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem(
          "sessionMessage",
          "Your account could not be found. Please login again."
        );

        window.location.href =
          "/login";

        return Promise.reject(error);
      }

      // ---------------------------------------
      // ACCOUNT INACTIVE
      // ---------------------------------------

      if (code === "ACCOUNT_INACTIVE") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem(
          "sessionMessage",
          "Your account is inactive. Please contact the administrator."
        );

        window.location.href =
          "/login";

        return Promise.reject(error);
      }

      // ---------------------------------------
      // Generic 401
      // ---------------------------------------

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.setItem(
        "sessionMessage",
        "Your session has expired. Please login again."
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);

export default api;