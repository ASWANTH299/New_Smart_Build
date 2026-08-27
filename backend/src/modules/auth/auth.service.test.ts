import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";
import { UserModel } from "../users/user.model.js";
import { LoginHistoryModel } from "./loginHistory.model.js";
import { hashPassword } from "../../utils/password.js";
import { UnauthorizedError, BadRequestError } from "../../utils/AppError.js";

describe("AuthService Unit Tests", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.restoreAllMocks();
  });

  it("should successfully authenticate valid user and return token + sanitized user", async () => {
    const hashedPassword = await hashPassword("ValidPassword123!");
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      name: "Rajesh Kumar",
      email: "rajesh@smartbuild.com",
      passwordHash: hashedPassword,
      primaryRole: "PROJECT_MANAGER",
      additionalPermissions: ["MANAGE_PROJECTS"],
      status: "ACTIVE",
      failedLoginCount: 0,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

    const result = await authService.login(
      "rajesh@smartbuild.com",
      "ValidPassword123!",
      "127.0.0.1",
      "Mozilla/5.0"
    );

    expect(result.token).toBeDefined();
    expect(result.user.name).toBe("Rajesh Kumar");
    expect(result.user.email).toBe("rajesh@smartbuild.com");
    expect(result.user.primaryRole).toBe("PROJECT_MANAGER");
    expect(mockUser.failedLoginCount).toBe(0);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError and increment failed count when password is wrong", async () => {
    const hashedPassword = await hashPassword("CorrectPassword123!");
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "engineer@smartbuild.com",
      passwordHash: hashedPassword,
      status: "ACTIVE",
      failedLoginCount: 2,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

    await expect(
      authService.login("engineer@smartbuild.com", "WrongPassword123!", "127.0.0.1", "TestAgent")
    ).rejects.toThrow(UnauthorizedError);

    expect(mockUser.failedLoginCount).toBe(3);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it("should lock account for 15 minutes upon reaching 5 failed login attempts", async () => {
    const hashedPassword = await hashPassword("CorrectPassword123!");
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "engineer@smartbuild.com",
      passwordHash: hashedPassword,
      status: "ACTIVE",
      failedLoginCount: 4,
      accountLockedUntil: null as Date | null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

    await expect(
      authService.login("engineer@smartbuild.com", "WrongPassword123!", "127.0.0.1", "TestAgent")
    ).rejects.toThrow(/Account has been locked/);

    expect(mockUser.failedLoginCount).toBe(5);
    expect(mockUser.status).toBe("LOCKED");
    expect(mockUser.accountLockedUntil).not.toBeNull();
  });

  it("should reject login for deactivated user accounts", async () => {
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "former@smartbuild.com",
      status: "DEACTIVATED",
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(LoginHistoryModel, "create").mockResolvedValue({} as unknown as ReturnType<typeof LoginHistoryModel.create>);

    await expect(
      authService.login("former@smartbuild.com", "AnyPassword123!", "127.0.0.1", "TestAgent")
    ).rejects.toThrow(/deactivated/i);
  });

  it("should reject password reset if token is invalid or expired", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    await expect(
      authService.resetPassword("expired-token", "NewSecurePass123!")
    ).rejects.toThrow(BadRequestError);
  });
});
