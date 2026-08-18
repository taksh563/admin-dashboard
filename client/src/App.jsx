


import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Unauthorized from "../pages/Unauthorized/Unauthorized";
import Users from "../pages/Users/Users";
import ProtectedRoute from "../routes/ProtectedRoute";
import RoleRoute from "../routes/RoleRoute";

import DashboardLayout from "../layouts/DashboardLayout";
import Logs from "../pages/Logs/Logs";
import EmailHistory from "../pages/Emails/EmailHistory";
import ComposeEmail from "../pages/Emails/ComposeEmail";
import EmailTemplates from "../pages/Emails/EmailTemplates";
import CategoryList from "../pages/Categories/CategoryList";
import ProductPage from "../pages/Products/ProductPage";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={<Login />}
      />
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/users"
          element={
            <RoleRoute roles={["admin", "user"]}>
              <Users />
            </RoleRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <RoleRoute roles={["admin"]}>
              <Logs />
            </RoleRoute>
          }
        />
        <Route
          path="/email/history"
          element={
            <RoleRoute roles={["admin"]}>
              <EmailHistory />
            </RoleRoute>
          }
        />

        <Route
          path="/email/compose"
          element={
            <RoleRoute roles={["admin"]}>
              <ComposeEmail />
            </RoleRoute>
          }
        />

        <Route
          path="/email/templates"
          element={
            <RoleRoute roles={["admin"]}>
              <EmailTemplates />
            </RoleRoute>
          }
        />

         <Route
          path="/categories"
          element={
            <RoleRoute roles={["admin", "manager"]}>
              <CategoryList />
            </RoleRoute>
          }
        />

         <Route
          path="/products"
          element={
            <RoleRoute roles={["admin", "manager"]}>
              <ProductPage />
            </RoleRoute>
          }
        />

        {/* <Route
          path="/products"
          element={
            <RoleRoute roles={["admin", "manager"]}>
              <ProductPage />
            </RoleRoute>
          }
        />

       
       

       
        <Route
          path="/settings"
          element={
            <RoleRoute roles={["admin"]}>
              <Settings />
            </RoleRoute>
          }
        /> */}





      </Route>
    </Routes>
  );
}

export default App;