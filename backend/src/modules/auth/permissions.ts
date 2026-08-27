import { UserRole, IUser } from "../users/user.model.js";

export const PERMISSIONS = {
  // Projects
  PROJECTS_VIEW: "projects:view",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_EDIT: "projects:edit",
  PROJECTS_DELETE: "projects:delete",

  // Tasks & Planning
  TASKS_VIEW: "tasks:view",
  TASKS_CREATE: "tasks:create",
  TASKS_EDIT: "tasks:edit",
  TASKS_DELETE: "tasks:delete",

  // Daily Site Logs & Issues
  DAILY_LOGS_VIEW: "daily_logs:view",
  DAILY_LOGS_CREATE: "daily_logs:create",
  DAILY_LOGS_EDIT: "daily_logs:edit",
  DAILY_LOGS_APPROVE: "daily_logs:approve",

  // Materials & Inventory
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_REQUEST: "inventory:request",
  INVENTORY_DISPATCH: "inventory:dispatch",
  INVENTORY_ADJUST: "inventory:adjust",

  // Procurement & Vendors
  PROCUREMENT_VIEW: "procurement:view",
  PROCUREMENT_CREATE: "procurement:create",
  PROCUREMENT_APPROVE: "procurement:approve",

  // Quality & Safety
  QUALITY_VIEW: "quality:view",
  QUALITY_INSPECT: "quality:inspect",
  SAFETY_VIEW: "safety:view",
  SAFETY_REPORT: "safety:report",

  // Budget & Financials
  BUDGET_VIEW: "budget:view",
  BUDGET_EDIT: "budget:edit",
  BUDGET_APPROVE: "budget:approve",

  // Workforce & Attendance
  WORKFORCE_VIEW: "workforce:view",
  WORKFORCE_MANAGE: "workforce:manage",
  ATTENDANCE_RECORD: "attendance:record",

  // Equipment & Assets
  EQUIPMENT_VIEW: "equipment:view",
  EQUIPMENT_MANAGE: "equipment:manage",

  // Documents
  DOCUMENTS_VIEW: "documents:view",
  DOCUMENTS_UPLOAD: "documents:upload",
  DOCUMENTS_DELETE: "documents:delete",

  // System Administration
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",

  // Client Portal
  CLIENT_PORTAL_VIEW: "client_portal:view",
  CLIENT_PORTAL_APPROVE: "client_portal:approve",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const ROLE_BASE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,

  PROJECT_MANAGER: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.DAILY_LOGS_VIEW,
    PERMISSIONS.DAILY_LOGS_CREATE,
    PERMISSIONS.DAILY_LOGS_EDIT,
    PERMISSIONS.DAILY_LOGS_APPROVE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_REQUEST,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.PROCUREMENT_APPROVE,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.QUALITY_INSPECT,
    PERMISSIONS.SAFETY_VIEW,
    PERMISSIONS.SAFETY_REPORT,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.BUDGET_EDIT,
    PERMISSIONS.BUDGET_APPROVE,
    PERMISSIONS.WORKFORCE_VIEW,
    PERMISSIONS.WORKFORCE_MANAGE,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.EQUIPMENT_MANAGE,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD,
    PERMISSIONS.USERS_VIEW,
  ],

  SITE_ENGINEER: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.DAILY_LOGS_VIEW,
    PERMISSIONS.DAILY_LOGS_CREATE,
    PERMISSIONS.DAILY_LOGS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_REQUEST,
    PERMISSIONS.QUALITY_VIEW,
    PERMISSIONS.QUALITY_INSPECT,
    PERMISSIONS.SAFETY_VIEW,
    PERMISSIONS.SAFETY_REPORT,
    PERMISSIONS.WORKFORCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD,
  ],

  STORE_MANAGER: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_REQUEST,
    PERMISSIONS.INVENTORY_DISPATCH,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD,
  ],

  CONTRACTOR: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_EDIT,
    PERMISSIONS.DAILY_LOGS_VIEW,
    PERMISSIONS.DAILY_LOGS_CREATE,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],

  CLIENT: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.CLIENT_PORTAL_VIEW,
    PERMISSIONS.CLIENT_PORTAL_APPROVE,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],
};

export const getEffectivePermissions = (user: IUser): Set<string> => {
  if (user.primaryRole === "ADMIN") {
    return new Set(ALL_PERMISSIONS);
  }

  const base = ROLE_BASE_PERMISSIONS[user.primaryRole] || [];
  const additional = user.additionalPermissions || [];

  return new Set([...base, ...additional]);
};

export const hasUserPermission = (user: IUser, requiredPermission: string): boolean => {
  if (user.primaryRole === "ADMIN") {
    return true;
  }
  const effective = getEffectivePermissions(user);
  return effective.has(requiredPermission);
};
