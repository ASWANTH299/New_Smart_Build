import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel, IUser } from "./user.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("User Management API Tests (Phase 6)", () => {
  const app = createApp();

  const adminToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  const engineerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439012",
    email: "engineer@smartbuild.com",
    role: "SITE_ENGINEER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject non-admin from creating a user with 403 Forbidden", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        primaryRole: "SITE_ENGINEER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${engineerToken}`)
      .send({
        name: "New Worker",
        email: "worker@smartbuild.com",
        primaryRole: "SITE_ENGINEER",
      });

    expect(res.status).toBe(403);
  });

  it("should allow ADMIN to create user and return 201", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "ADMIN",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(UserModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439099",
      name: "New Engineer",
      email: "engineer2@smartbuild.com",
      primaryRole: "SITE_ENGINEER",
      additionalPermissions: [],
      status: "PENDING_ACTIVATION",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IUser);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Engineer",
        email: "engineer2@smartbuild.com",
        primaryRole: "SITE_ENGINEER",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("engineer2@smartbuild.com");
  });

  it("should return paginated user list for ADMIN", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "ADMIN",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(UserModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439011",
          name: "Admin User",
          email: "admin@smartbuild.com",
          primaryRole: "ADMIN",
          additionalPermissions: [],
          status: "ACTIVE",
        },
      ]),
    } as unknown as ReturnType<typeof UserModel.find>);

    vi.spyOn(UserModel, "countDocuments").mockReturnValue({
      exec: vi.fn().mockResolvedValue(1),
    } as unknown as ReturnType<typeof UserModel.countDocuments>);

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total", 1);
  });
});
