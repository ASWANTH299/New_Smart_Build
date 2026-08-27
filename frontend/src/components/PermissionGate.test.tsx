import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "./PermissionGate.js";
import * as useAuthModule from "../hooks/useAuth.js";

describe("PermissionGate Component (Phase 5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when user role matches allowed roles", () => {
    vi.spyOn(useAuthModule, "usePermissions").mockReturnValue({
      userRole: "PROJECT_MANAGER",
      hasRole: (roles) => (Array.isArray(roles) ? roles.includes("PROJECT_MANAGER") : roles === "PROJECT_MANAGER"),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      effectivePermissions: [],
      isAdmin: false,
      isProjectManager: true,
      isSiteEngineer: false,
      isStoreManager: false,
      isContractor: false,
      isClient: false,
    });

    render(
      <PermissionGate roles={["PROJECT_MANAGER", "ADMIN"]} fallback={<p>Fallback</p>}>
        <p>Protected Action</p>
      </PermissionGate>
    );

    expect(screen.getByText("Protected Action")).toBeInTheDocument();
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
  });

  it("renders fallback when user lacks allowed role", () => {
    vi.spyOn(useAuthModule, "usePermissions").mockReturnValue({
      userRole: "CLIENT",
      hasRole: () => false,
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      effectivePermissions: [],
      isAdmin: false,
      isProjectManager: false,
      isSiteEngineer: false,
      isStoreManager: false,
      isContractor: false,
      isClient: true,
    });

    render(
      <PermissionGate roles={["ADMIN", "PROJECT_MANAGER"]} fallback={<p>Fallback</p>}>
        <p>Protected Action</p>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected Action")).not.toBeInTheDocument();
    expect(screen.getByText("Fallback")).toBeInTheDocument();
  });

  it("always renders children for ADMIN regardless of restrictions", () => {
    vi.spyOn(useAuthModule, "usePermissions").mockReturnValue({
      userRole: "ADMIN",
      hasRole: () => true,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      effectivePermissions: [],
      isAdmin: true,
      isProjectManager: false,
      isSiteEngineer: false,
      isStoreManager: false,
      isContractor: false,
      isClient: false,
    });

    render(
      <PermissionGate permission="custom:rare_perm" fallback={<p>Denied</p>}>
        <p>Admin Override Content</p>
      </PermissionGate>
    );

    expect(screen.getByText("Admin Override Content")).toBeInTheDocument();
  });
});
