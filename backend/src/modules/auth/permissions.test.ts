import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  getEffectivePermissions,
  hasUserPermission,
} from "./permissions.js";
import { IUser } from "../users/user.model.js";

describe("Permissions & Role Resolution (Phase 5)", () => {
  it("should grant all system permissions to ADMIN role", () => {
    const adminUser = {
      primaryRole: "ADMIN",
      additionalPermissions: [],
    } as unknown as IUser;

    const permissions = getEffectivePermissions(adminUser);
    expect(permissions.has(PERMISSIONS.USERS_MANAGE)).toBe(true);
    expect(permissions.has(PERMISSIONS.PROJECTS_CREATE)).toBe(true);
    expect(permissions.has(PERMISSIONS.BUDGET_APPROVE)).toBe(true);
    expect(hasUserPermission(adminUser, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
  });

  it("should resolve base permissions for PROJECT_MANAGER", () => {
    const pmUser = {
      primaryRole: "PROJECT_MANAGER",
      additionalPermissions: [],
    } as unknown as IUser;

    const permissions = getEffectivePermissions(pmUser);
    expect(permissions.has(PERMISSIONS.PROJECTS_VIEW)).toBe(true);
    expect(permissions.has(PERMISSIONS.BUDGET_APPROVE)).toBe(true);
    expect(permissions.has(PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it("should resolve base permissions for SITE_ENGINEER", () => {
    const siteEngineer = {
      primaryRole: "SITE_ENGINEER",
      additionalPermissions: [],
    } as unknown as IUser;

    const permissions = getEffectivePermissions(siteEngineer);
    expect(permissions.has(PERMISSIONS.DAILY_LOGS_CREATE)).toBe(true);
    expect(permissions.has(PERMISSIONS.SAFETY_REPORT)).toBe(true);
    expect(permissions.has(PERMISSIONS.BUDGET_APPROVE)).toBe(false);
  });

  it("should combine primary role base permissions with additional permissions", () => {
    const siteEngineerWithBudget = {
      primaryRole: "SITE_ENGINEER",
      additionalPermissions: [PERMISSIONS.BUDGET_VIEW, PERMISSIONS.BUDGET_EDIT],
    } as unknown as IUser;

    const permissions = getEffectivePermissions(siteEngineerWithBudget);
    // Base permission
    expect(permissions.has(PERMISSIONS.DAILY_LOGS_CREATE)).toBe(true);
    // Additional granted permission
    expect(permissions.has(PERMISSIONS.BUDGET_VIEW)).toBe(true);
    expect(permissions.has(PERMISSIONS.BUDGET_EDIT)).toBe(true);
    // Still not granted
    expect(permissions.has(PERMISSIONS.BUDGET_APPROVE)).toBe(false);
  });

  it("should isolate CLIENT role to client portal and project view only", () => {
    const clientUser = {
      primaryRole: "CLIENT",
      additionalPermissions: [],
    } as unknown as IUser;

    const permissions = getEffectivePermissions(clientUser);
    expect(permissions.has(PERMISSIONS.CLIENT_PORTAL_VIEW)).toBe(true);
    expect(permissions.has(PERMISSIONS.CLIENT_PORTAL_APPROVE)).toBe(true);
    expect(permissions.has(PERMISSIONS.PROJECTS_VIEW)).toBe(true);
    expect(permissions.has(PERMISSIONS.DAILY_LOGS_CREATE)).toBe(false);
    expect(permissions.has(PERMISSIONS.INVENTORY_VIEW)).toBe(false);
  });
});
