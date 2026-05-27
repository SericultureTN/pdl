import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";

import { PlantationOverallPage } from "@/pages/data-entry/PlantationOverallPage";
import { PlantationScheme2024Page } from "@/pages/data-entry/PlantationScheme2024Page";
import { PlantationScheme2025Page } from "@/pages/data-entry/PlantationScheme2025Page";
import { DflsDistributionPage } from "@/pages/data-entry/DflsDistributionPage";
import { DflsConsumptionPage } from "@/pages/data-entry/DflsConsumptionPage";
import { CocoonProductionPage } from "@/pages/data-entry/CocoonProductionPage";

import { ReportsPage } from "@/pages/reports/ReportsPage";
import { MisAnalyticsPage } from "@/pages/analytics/MisAnalyticsPage";
import { UserManagementPage } from "@/pages/users/UserManagementPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "data-entry",
        children: [
          { path: "plantation-overall", element: <PlantationOverallPage /> },
          { path: "plantation-scheme-2024-25", element: <PlantationScheme2024Page /> },
          { path: "plantation-scheme-2025-26", element: <PlantationScheme2025Page /> },
          { path: "dfls-distribution", element: <DflsDistributionPage /> },
          { path: "dfls-consumption", element: <DflsConsumptionPage /> },
          { path: "cocoon-production", element: <CocoonProductionPage /> },
        ],
      },
      { path: "reports", element: <ReportsPage /> },
      { path: "mis-analytics", element: <MisAnalyticsPage /> },
      { path: "user-management", element: <UserManagementPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/app/dashboard" replace /> },
]);

