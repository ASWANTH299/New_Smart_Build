import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import * as useAuthModule from "../hooks/useAuth.js";

describe("Sidebar Navigation RBAC Tests (Phase 5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Admin navigation including System Settings", () => {
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
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Site Operations")).toBeInTheDocument();
    expect(screen.getByText("Inventory & Materials")).toBeInTheDocument();
    expect(screen.getByText("System Settings")).toBeInTheDocument();
  });

  it("renders Site Engineer navigation hiding Inventory and System Settings", () => {
    vi.spyOn(useAuthModule, "usePermissions").mockReturnValue({
      userRole: "SITE_ENGINEER",
      hasRole: (roles) => (Array.isArray(roles) ? roles.includes("SITE_ENGINEER") : roles === "SITE_ENGINEER"),
      hasPermission: vi.fn(),
      hasAnyPermission: vi.fn(),
      effectivePermissions: [],
      isAdmin: false,
      isProjectManager: false,
      isSiteEngineer: true,
      isStoreManager: false,
      isContractor: false,
      isClient: false,
    });

    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("Site Operations")).toBeInTheDocument();
    expect(screen.getByText("Quality & Safety")).toBeInTheDocument();
    expect(screen.queryByText("Inventory & Materials")).not.toBeInTheDocument();
    expect(screen.queryByText("System Settings")).not.toBeInTheDocument();
  });

  it("renders Client navigation with Client Portal and hides internal operations", () => {
    vi.spyOn(useAuthModule, "usePermissions").mockReturnValue({
      userRole: "CLIENT",
      hasRole: (roles) => (Array.isArray(roles) ? roles.includes("CLIENT") : roles === "CLIENT"),
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
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("Client Portal")).toBeInTheDocument();
    expect(screen.queryByText("Site Operations")).not.toBeInTheDocument();
    expect(screen.queryByText("Inventory & Materials")).not.toBeInTheDocument();
    expect(screen.queryByText("System Settings")).not.toBeInTheDocument();
  });
});
