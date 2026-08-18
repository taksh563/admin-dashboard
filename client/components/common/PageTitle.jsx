import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "Admin Dashboard";

const PAGE_TITLES = {
  "/": "Login",
  "/login": "Login",
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/categories": "Categories",
  "/products": "Products",
  "/audit-logs": "Activity Logs",
  "/logs": "Activity Logs",
  "/emails": "Email",
  "/email/templates": "Email Templates",
  "/email/history": "Email Logs",
  "/email/compose": "Compose Email",
  "/profile": "Profile",
  "/settings": "Settings",
};

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    let pageTitle = PAGE_TITLES[currentPath];

    // Handle nested routes
    if (!pageTitle) {
      if (currentPath.startsWith("/users")) {
        pageTitle = "Users";
      } else if (currentPath.startsWith("/products")) {
        pageTitle = "Products";
      } else if (currentPath.startsWith("/categories")) {
        pageTitle = "Categories";
      } else if (
        currentPath.startsWith("/audit-logs") ||
        currentPath.startsWith("/logs")
      ) {
        pageTitle = "Activity Logs";
      } else if (
        currentPath.startsWith("/emails") ||
        currentPath.startsWith("/email-templates")
      ) {
        pageTitle = "Email";
      } else if (currentPath.startsWith("/profile")) {
        pageTitle = "Profile";
      } else if (currentPath.startsWith("/settings")) {
        pageTitle = "Settings";
      } else {
        pageTitle = "Dashboard";
      }
    }

    document.title = `${pageTitle} | ${APP_NAME}`;
  }, [location.pathname]);

  return null;
};

export default PageTitle;