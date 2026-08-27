import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { UserRole } from "../types/index.js";
import { PermissionDenied } from "../components/ui/PermissionDenied.js";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.primaryRole)) {
    return (
      <div className="py-8">
        <PermissionDenied
          title="Access Restricted"
          message={`Your role (${user.primaryRole}) does not have permission to view this section.`}
        />
      </div>
    );
  }

  if (requiredPermission && user.primaryRole !== "ADMIN" && !user.additionalPermissions?.includes(requiredPermission)) {
    return (
      <div className="py-8">
        <PermissionDenied
          title="Permission Required"
          message={`You require the '${requiredPermission}' capability to access this feature.`}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
