import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export interface PublicRouteProps {
  children: React.ReactNode;
  restrictedWhenAuthenticated?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restrictedWhenAuthenticated = true,
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated && restrictedWhenAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
