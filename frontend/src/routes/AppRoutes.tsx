import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.js";
import { AuthLayout } from "../layouts/AuthLayout.js";
import { ClientLayout } from "../layouts/ClientLayout.js";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { PublicRoute } from "./PublicRoute.js";

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ActivateAccountPage,
  DashboardPage,
  ProjectsPage,
  NotFoundPage,
  PermissionDeniedPage,
} from "../pages/index.js";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Authentication Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/activate-account" element={<ActivateAccountPage />} />
      </Route>

      {/* 2. Client Portal Routes */}
      <Route
        path="/client-portal"
        element={
          <ProtectedRoute allowedRoles={["CLIENT", "ADMIN"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>

      {/* 3. Protected Workspace Internal Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/operations"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Site Operations Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for Phase 6.</p>
            </div>
          }
        />
        <Route
          path="/inventory"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Materials & Inventory Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for Phase 7.</p>
            </div>
          }
        />
        <Route
          path="/quality-safety"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Quality & Safety Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for Phase 8.</p>
            </div>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
                <h2 className="text-lg font-bold text-slate-900">System Admin Settings</h2>
                <p className="text-xs text-slate-500 mt-1">Administrator controls ready for Phase 11.</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/permission-denied" element={<PermissionDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
