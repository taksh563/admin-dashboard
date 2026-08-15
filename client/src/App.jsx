


import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Unauthorized from "../pages/Unauthorized/Unauthorized";
import Users from "../pages/Users/Users";
import ProtectedRoute from "../routes/ProtectedRoute";
import RoleRoute from "../routes/RoleRoute";

import DashboardLayout from "../layouts/DashboardLayout";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
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

        {/* <Route
          path="/products"
          element={
            <RoleRoute roles={["admin", "manager"]}>
              <Products />
            </RoleRoute>
          }
        />

       
        <Route
          path="/categories"
          element={
            <RoleRoute roles={["admin", "manager"]}>
              <Categories />
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