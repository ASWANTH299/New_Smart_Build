import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types/index.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("smart_build_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("smart_build_token");
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("smart_build_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("smart_build_user");
    }

    if (token) {
      localStorage.setItem("smart_build_token", token);
    } else {
      localStorage.removeItem("smart_build_token");
    }
  }, [user, token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("smart_build_token");
    localStorage.removeItem("smart_build_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (allowedRoles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.primaryRole);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.primaryRole === "ADMIN") return true;
    if (user.effectivePermissions?.includes(permission)) return true;
    return user.additionalPermissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.primaryRole === "ADMIN") return true;
    return permissions.some((p) => hasPermission(p));
  };

  return {
    userRole: user?.primaryRole,
    hasRole,
    hasPermission,
    hasAnyPermission,
    effectivePermissions: user?.effectivePermissions || [],
    isAdmin: user?.primaryRole === "ADMIN",
    isProjectManager: user?.primaryRole === "PROJECT_MANAGER",
    isSiteEngineer: user?.primaryRole === "SITE_ENGINEER",
    isStoreManager: user?.primaryRole === "STORE_MANAGER",
    isContractor: user?.primaryRole === "CONTRACTOR",
    isClient: user?.primaryRole === "CLIENT",
  };
};

export default useAuth;
