export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "STORE_MANAGER"
  | "CONTRACTOR"
  | "CLIENT";

export interface User {
  id: string;
  name: string;
  email: string;
  primaryRole: UserRole;
  additionalPermissions: string[];
  effectivePermissions?: string[];
  status: "ACTIVE" | "DEACTIVATED" | "LOCKED" | "PENDING_ACTIVATION";
  lastLoginAt?: string | Date | null;
}

export interface ProjectContextType {
  id: string;
  code: string;
  name: string;
  status: "DRAFT" | "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  health: "HEALTHY" | "AT_RISK" | "CRITICAL";
  progress: number;
}

export type StatusVariant =
  | "healthy"
  | "risk"
  | "critical"
  | "draft"
  | "active"
  | "completed"
  | "archived"
  | "pending"
  | "approved"
  | "rejected";

export interface NavItem {
  name: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
  permission?: string;
  badge?: string | number;
}
