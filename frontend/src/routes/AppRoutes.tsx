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
  CreateProjectPage,
  ProjectOverviewPage,
  EditProjectPage,
  PhasesPage,
  PhaseDetailPage,
  TasksPage,
  TaskDetailPage,
  MilestonesPage,
  UsersPage,
  UserDetailPage,
  EditUserPage,
  ProfilePage,
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

        {/* Global Tasks Direct Route */}
        <Route path="/tasks" element={<TasksPage />} />

        {/* Project Routes */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
              <CreateProjectPage />
            </ProtectedRoute>
          }
        />
        <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
        <Route
          path="/projects/:projectId/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "PROJECT_MANAGER"]}>
              <EditProjectPage />
            </ProtectedRoute>
          }
        />

        {/* Project Planning Routes */}
        <Route path="/projects/:projectId/phases" element={<PhasesPage />} />
        <Route path="/projects/:projectId/phases/:phaseId" element={<PhaseDetailPage />} />
        <Route path="/projects/:projectId/tasks" element={<TasksPage />} />
        <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/projects/:projectId/milestones" element={<MilestonesPage />} />

        {/* Admin Organization & User Directory */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <EditUserPage />
            </ProtectedRoute>
          }
        />

        {/* Account Profile Route */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Module Placeholders */}
        <Route
          path="/operations"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Site Operations Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for subsequent phases.</p>
            </div>
          }
        />
        <Route
          path="/inventory"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Materials & Inventory Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for subsequent phases.</p>
            </div>
          }
        />
        <Route
          path="/quality-safety"
          element={
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">Quality & Safety Module</h2>
              <p className="text-xs text-slate-500 mt-1">Foundation shell ready for subsequent phases.</p>
            </div>
          }
        />

        <Route path="/permission-denied" element={<PermissionDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
