import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth, usePermissions } from "./useAuth.js";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Auth & Permissions Hooks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize unauthenticated by default", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should update state on login and persist to localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("token-abc", {
        id: "1",
        name: "Admin User",
        email: "admin@smartbuild.com",
        primaryRole: "ADMIN",
        additionalPermissions: ["MANAGE_USERS"],
        status: "ACTIVE",
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe("Admin User");
    expect(localStorage.getItem("smart_build_token")).toBe("token-abc");
  });

  it("should correctly evaluate role and permission checks", () => {
    const { result: authResult } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      authResult.current.login("token-abc", {
        id: "1",
        name: "Site Engineer",
        email: "engineer@smartbuild.com",
        primaryRole: "SITE_ENGINEER",
        additionalPermissions: ["CREATE_DAILY_LOG"],
        status: "ACTIVE",
      });
    });

    const { result: permResult } = renderHook(() => usePermissions(), { wrapper });
    expect(permResult.current.isSiteEngineer).toBe(true);
    expect(permResult.current.isAdmin).toBe(false);
    expect(permResult.current.hasRole(["SITE_ENGINEER", "PROJECT_MANAGER"])).toBe(true);
    expect(permResult.current.hasPermission("CREATE_DAILY_LOG")).toBe(true);
    expect(permResult.current.hasPermission("DELETE_PROJECT")).toBe(false);
  });
});
