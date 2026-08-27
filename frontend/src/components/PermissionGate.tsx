import React, { ReactNode } from "react";
import { UserRole } from "../types/index.js";
import { usePermissions } from "../hooks/useAuth.js";

export interface PermissionGateProps {
  roles?: UserRole[];
  permission?: string;
  anyPermissions?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  roles,
  permission,
  anyPermissions,
  fallback = null,
  children,
}) => {
  const { hasRole, hasPermission, hasAnyPermission, isAdmin } = usePermissions();

  if (isAdmin) {
    return <>{children}</>;
  }

  if (roles && roles.length > 0) {
    if (!hasRole(roles)) {
      return <>{fallback}</>;
    }
  }

  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  if (anyPermissions && anyPermissions.length > 0) {
    if (!hasAnyPermission(anyPermissions)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGate;
