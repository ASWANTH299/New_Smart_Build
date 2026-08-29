import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import { AccessRequestModel } from "./accessRequest.model.js";
import { UserModel, IUser } from "./user.model.js";
import { AuditLogModel } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Access Request & Onboarding API Tests", () => {
  const app = createApp();
  const adminId = new mongoose.Types.ObjectId();
  const adminToken = generateJwtToken({
    userId: adminId.toString(),
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  const pmId = new mongoose.Types.ObjectId();
  const pmToken = generateJwtToken({
    userId: pmId.toString(),
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof AuditLogModel.create>);
  });

  describe("POST /api/v1/auth/request-access", () => {
    it("should allow public visitor to submit valid access request", async () => {
      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      vi.spyOn(AccessRequestModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof AccessRequestModel.findOne>);

      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        name: "Jane Engineer",
        email: "jane@engineer.com",
        requestedRole: "SITE_ENGINEER",
        organization: "Civil Build Ltd",
        reason: "Site supervisor",
        status: "PENDING",
        createdAt: new Date(),
      };

      vi.spyOn(AccessRequestModel, "create").mockResolvedValue(mockCreated as unknown as ReturnType<typeof AccessRequestModel.create>);

      const res = await request(app)
        .post("/api/v1/auth/request-access")
        .send({
          name: "Jane Engineer",
          email: "jane@engineer.com",
          requestedRole: "SITE_ENGINEER",
          organization: "Civil Build Ltd",
          reason: "Site supervisor",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("jane@engineer.com");
      expect(res.body.data.status).toBe("PENDING");
    });

    it("should reject access request with invalid role or missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-access")
        .send({
          name: "Invalid Role",
          email: "invalid@test.com",
          requestedRole: "SUPER_GOD_MODE_ADMIN",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users/access-requests", () => {
    it("should allow ADMIN to retrieve access requests list", async () => {
      vi.spyOn(UserModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: adminId,
          email: "admin@smartbuild.com",
          primaryRole: "ADMIN",
          status: "ACTIVE",
        }),
      } as unknown as ReturnType<typeof UserModel.findById>);

      vi.spyOn(AccessRequestModel, "find").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Jane Engineer",
            email: "jane@engineer.com",
            requestedRole: "SITE_ENGINEER",
            status: "PENDING",
          },
        ]),
      } as unknown as ReturnType<typeof AccessRequestModel.find>);

      vi.spyOn(AccessRequestModel, "countDocuments").mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      } as unknown as ReturnType<typeof AccessRequestModel.countDocuments>);

      const res = await request(app)
        .get("/api/v1/users/access-requests")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it("should reject non-ADMIN users with 403 Forbidden", async () => {
      vi.spyOn(UserModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: pmId,
          email: "pm@smartbuild.com",
          primaryRole: "PROJECT_MANAGER",
          status: "ACTIVE",
        }),
      } as unknown as ReturnType<typeof UserModel.findById>);

      const res = await request(app)
        .get("/api/v1/users/access-requests")
        .set("Authorization", `Bearer ${pmToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v1/users/access-requests/:id/approve", () => {
    it("should allow ADMIN to approve access request and assign role", async () => {
      const requestId = new mongoose.Types.ObjectId();
      const mockReq = {
        _id: requestId,
        name: "Jane Engineer",
        email: "jane@engineer.com",
        status: "PENDING",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(UserModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: adminId,
          email: "admin@smartbuild.com",
          primaryRole: "ADMIN",
          status: "ACTIVE",
        }),
      } as unknown as ReturnType<typeof UserModel.findById>);

      vi.spyOn(AccessRequestModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockReq),
      } as unknown as ReturnType<typeof AccessRequestModel.findById>);

      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      vi.spyOn(UserModel, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: "jane@engineer.com",
        primaryRole: "SITE_ENGINEER",
        status: "PENDING_ACTIVATION",
      } as unknown as IUser);

      const res = await request(app)
        .post(`/api/v1/users/access-requests/${requestId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assignedRole: "SITE_ENGINEER",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("activationToken");
    });
  });

  describe("POST /api/v1/auth/activate", () => {
    it("should allow approved user with valid activation token to set password and activate", async () => {
      const rawToken = "valid-activation-token-12345";
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Jane Engineer",
        email: "jane@engineer.com",
        status: "PENDING_ACTIVATION",
        activationToken: rawToken,
        activationExpires: new Date(Date.now() + 100000),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      const res = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          token: rawToken,
          password: "SecurePassword@123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUser.status).toBe("ACTIVE");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should reject activation if token is expired or invalid", async () => {
      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      const res = await request(app)
        .post("/api/v1/auth/activate")
        .send({
          token: "invalid-token",
          password: "SecurePassword@123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
