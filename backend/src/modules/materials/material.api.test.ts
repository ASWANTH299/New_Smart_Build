import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { UserModel } from "../users/user.model.js";
import MaterialModel, { IMaterial } from "./material.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

describe("Materials API Integration Tests (Phase 8)", () => {
  const app = createApp();

  const storeManagerToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439011",
    email: "store@smartbuild.com",
    role: "STORE_MANAGER",
  });

  const clientToken = generateJwtToken({
    userId: "507f1f77bcf86cd799439012",
    email: "client@smartbuild.com",
    role: "CLIENT",
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow Store Manager to list materials", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "STORE_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(MaterialModel, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439020",
          code: "MAT-STL-001",
          name: "Reinforcing Steel Rebar 12mm",
          category: "Steel",
          unit: "Tons",
        },
      ]),
    } as unknown as ReturnType<typeof MaterialModel.find>);

    vi.spyOn(MaterialModel, "countDocuments").mockResolvedValue(1);

    const res = await request(app)
      .get("/api/v1/materials")
      .set("Authorization", `Bearer ${storeManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].code).toBe("MAT-STL-001");
  });

  it("should allow Store Manager to create material", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        primaryRole: "STORE_MANAGER",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(MaterialModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof MaterialModel.findOne>);

    vi.spyOn(MaterialModel, "create").mockResolvedValue({
      _id: "507f1f77bcf86cd799439021",
      code: "MAT-BRK-001",
      name: "Standard Red Clay Bricks",
      category: "Masonry",
      unit: "Pieces",
      minimumStock: 500,
      reorderLevel: 1000,
    } as unknown as IMaterial);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const res = await request(app)
      .post("/api/v1/materials")
      .set("Authorization", `Bearer ${storeManagerToken}`)
      .send({
        code: "MAT-BRK-001",
        name: "Standard Red Clay Bricks",
        category: "Masonry",
        unit: "Pieces",
        minimumStock: 500,
        reorderLevel: 1000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe("MAT-BRK-001");
  });

  it("should block Client from creating materials (RBAC)", async () => {
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439012",
        primaryRole: "CLIENT",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const res = await request(app)
      .post("/api/v1/materials")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        code: "MAT-ILLEGAL",
        name: "Unauthorized Material",
        category: "General",
        unit: "Units",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
