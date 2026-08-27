import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import { LoginHistoryModel } from "./loginHistory.model.js";
import { hashPassword } from "../../utils/password.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Authentication API Integration Tests (Phase 4)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 422 when email or password is missing or invalid format", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "not-an-email",
        password: "",
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should return 200 with JWT and user object for valid credentials", async () => {
      const hashedPassword = await hashPassword("StrongPassword123!");
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Vikram Malhotra",
        email: "vikram@smartbuild.com",
        passwordHash: hashedPassword,
        primaryRole: "PROJECT_MANAGER",
        additionalPermissions: [],
        status: "ACTIVE",
        failedLoginCount: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "vikram@smartbuild.com",
        password: "StrongPassword123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toHaveProperty("email", "vikram@smartbuild.com");
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
    });

    it("should return 401 when password does not match", async () => {
      const hashedPassword = await hashPassword("StrongPassword123!");
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "vikram@smartbuild.com",
        passwordHash: hashedPassword,
        status: "ACTIVE",
        failedLoginCount: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "vikram@smartbuild.com",
        password: "IncorrectPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Protected Endpoints (GET /api/v1/auth/me & POST /api/v1/auth/logout)", () => {
    it("should return 401 when accessing /me without Authorization header", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should return 200 with current user data when valid Bearer token is provided", async () => {
      const validToken = generateJwtToken({
        userId: "507f1f77bcf86cd799439011",
        email: "vikram@smartbuild.com",
        role: "PROJECT_MANAGER",
      });

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Vikram Malhotra",
        email: "vikram@smartbuild.com",
        primaryRole: "PROJECT_MANAGER",
        additionalPermissions: [],
        status: "ACTIVE",
      };

      vi.spyOn(UserModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as unknown as ReturnType<typeof UserModel.findById>);

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe("Vikram Malhotra");
    });

    it("should return 200 on logout with valid token", async () => {
      const validToken = generateJwtToken({
        userId: "507f1f77bcf86cd799439011",
        email: "vikram@smartbuild.com",
        role: "PROJECT_MANAGER",
      });

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        status: "ACTIVE",
      };

      vi.spyOn(UserModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as unknown as ReturnType<typeof UserModel.findById>);

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Password Reset & Account Activation Endpoints", () => {
    it("should accept forgot-password request with 200", async () => {
      vi.spyOn(UserModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          email: "vikram@smartbuild.com",
          status: "ACTIVE",
          save: vi.fn().mockResolvedValue(true),
        }),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "vikram@smartbuild.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject password reset when password is under 8 characters", async () => {
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: "some-token", password: "short" });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
