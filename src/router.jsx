import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import AdminBackupManagementPage from "./pages/AdminBackupManagementPage";
import EmployeeBackupsPage from "./pages/EmployeeBackupsPage";
import CompanyBackupManagementPage from "./pages/CompanyBackupManagementPage";
import LogsPage from "./pages/LogsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "user-management",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <UserManagementPage />
          </ProtectedRoute>
        )
      },
      {
        path: "admin-companies",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminCompaniesPage />
          </ProtectedRoute>
        )
      },
      {
        path: "admin-backup-management",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminBackupManagementPage />
          </ProtectedRoute>
        )
      },
      {
        path: "activity-logs",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <LogsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "employee-backups",
        element: (
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <EmployeeBackupsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "company-backup-management",
        element: (
          <ProtectedRoute allowedRoles={["COMPANY"]}>
            <CompanyBackupManagementPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
