import { describe, it, expect, vi, beforeEach } from "vitest";
import { seedDatabase } from "./seed.js";
import { UserModel, IUser } from "../modules/users/user.model.js";
import { ProjectTypeModel } from "../modules/project-types/projectType.model.js";
import { authService } from "../modules/auth/auth.service.js";
import { hashPassword } from "../utils/password.js";
import { UnauthorizedError } from "../utils/AppError.js";

describe("Admin Bootstrap & Seed Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.INITIAL_ADMIN_EMAIL = "admin@smartbuild.com";
    process.env.INITIAL_ADMIN_PASSWORD = "Admin@123456";
    process.env.INITIAL_ADMIN_NAME = "System Administrator";
    delete process.env.RESET_ADMIN_PASSWORD;
  });

  it("should fail clearly if required bootstrap credentials are missing when creation is required", async () => {
    delete process.env.INITIAL_ADMIN_EMAIL;
    delete process.env.INITIAL_ADMIN_PASSWORD;

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    await expect(seedDatabase()).rejects.toThrow(
      "Missing required bootstrap environment variables"
    );
  });

  it("should create initial ADMIN user with hashed password when none exists", async () => {
    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(ProjectTypeModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "res-1" }),
    } as unknown as ReturnType<typeof ProjectTypeModel.findOne>);

    const createSpy = vi.spyOn(UserModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439001",
      email: "admin@smartbuild.com",
      primaryRole: "ADMIN",
      status: "ACTIVE",
    } as unknown as IUser);

    const result = await seedDatabase();

    expect(result.adminCreated).toBe(true);
    expect(result.adminEmail).toBe("admin@smartbuild.com");
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@smartbuild.com",
        primaryRole: "ADMIN",
        status: "ACTIVE",
      })
    );
  });

  it("should be idempotent and not overwrite password if ADMIN already exists", async () => {
    const existingAdminMock = {
      _id: "507f1f77bcf86cd799439001",
      email: "admin@smartbuild.com",
      passwordHash: "$2a$12$existingHashThatShouldNotBeOverwritten",
      primaryRole: "ADMIN",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingAdminMock),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(ProjectTypeModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "res-1" }),
    } as unknown as ReturnType<typeof ProjectTypeModel.findOne>);

    const createSpy = vi.spyOn(UserModel, "create");

    const result = await seedDatabase();

    expect(result.adminCreated).toBe(false);
    expect(result.adminUpdated).toBe(false);
    expect(createSpy).not.toHaveBeenCalled();
    expect(existingAdminMock.save).not.toHaveBeenCalled();
  });

  it("should safely reset admin password when explicitly requested via options or flag", async () => {
    const existingAdminMock = {
      _id: "507f1f77bcf86cd799439001",
      email: "admin@smartbuild.com",
      passwordHash: "$2a$12$oldHash",
      status: "LOCKED",
      failedLoginCount: 5,
      accountLockedUntil: new Date(Date.now() + 100000),
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(existingAdminMock),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    vi.spyOn(ProjectTypeModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "res-1" }),
    } as unknown as ReturnType<typeof ProjectTypeModel.findOne>);

    const result = await seedDatabase({ resetAdminPassword: true });

    expect(result.adminUpdated).toBe(true);
    expect(existingAdminMock.status).toBe("ACTIVE");
    expect(existingAdminMock.failedLoginCount).toBe(0);
    expect(existingAdminMock.accountLockedUntil).toBe(null);
    expect(existingAdminMock.save).toHaveBeenCalled();
  });

  it("should allow seeded ADMIN user to successfully log in and receive JWT token", async () => {
    const rawPassword = "Admin@123456";
    const passwordHash = await hashPassword(rawPassword);

    const mockAdminUser = {
      _id: "507f1f77bcf86cd799439001",
      name: "System Administrator",
      email: "admin@smartbuild.com",
      passwordHash,
      primaryRole: "ADMIN",
      status: "ACTIVE",
      failedLoginCount: 0,
      accountLockedUntil: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockAdminUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    const loginResult = await authService.login(
      "admin@smartbuild.com",
      rawPassword,
      "127.0.0.1",
      "vitest-agent"
    );

    expect(loginResult).toHaveProperty("token");
    expect(loginResult.user.email).toBe("admin@smartbuild.com");
    expect(loginResult.user.primaryRole).toBe("ADMIN");
    expect(typeof loginResult.token).toBe("string");
    expect(loginResult.token.length).toBeGreaterThan(20);
  });

  it("should reject login when invalid password is provided", async () => {
    const rawPassword = "Admin@123456";
    const passwordHash = await hashPassword(rawPassword);

    const mockAdminUser = {
      _id: "507f1f77bcf86cd799439001",
      name: "System Administrator",
      email: "admin@smartbuild.com",
      passwordHash,
      primaryRole: "ADMIN",
      status: "ACTIVE",
      failedLoginCount: 0,
      accountLockedUntil: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(UserModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockAdminUser),
    } as unknown as ReturnType<typeof UserModel.findOne>);

    await expect(
      authService.login(
        "admin@smartbuild.com",
        "WrongPassword@999",
        "127.0.0.1",
        "vitest-agent"
      )
    ).rejects.toThrow(UnauthorizedError);
  });
});
