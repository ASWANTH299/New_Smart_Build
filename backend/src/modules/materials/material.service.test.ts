import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialService } from "./material.service.js";
import MaterialModel, { IMaterial } from "./material.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { ConflictError, NotFoundError } from "../../utils/AppError.js";

describe("MaterialService Unit Tests (Phase 8)", () => {
  let materialService: MaterialService;

  beforeEach(() => {
    materialService = new MaterialService();
    vi.restoreAllMocks();
  });

  it("should create a new material with unique code and log audit", async () => {
    vi.spyOn(MaterialModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof MaterialModel.findOne>);

    const mockCreated = {
      _id: "507f1f77bcf86cd799439011",
      code: "MAT-CON-001",
      name: "Portland Cement Type I",
      category: "Cement & Aggregates",
      unit: "Bags",
      minimumStock: 50,
      reorderLevel: 100,
    };
    vi.spyOn(MaterialModel, "create").mockResolvedValue(mockCreated as unknown as IMaterial);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await materialService.createMaterial(
      {
        code: "mat-con-001",
        name: "Portland Cement Type I",
        category: "Cement & Aggregates",
        unit: "Bags",
        minimumStock: 50,
        reorderLevel: 100,
      },
      "507f1f77bcf86cd799439099"
    );

    expect(result.code).toBe("MAT-CON-001");
    expect(result.name).toBe("Portland Cement Type I");
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should throw ConflictError if material code already exists", async () => {
    vi.spyOn(MaterialModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "existing" }),
    } as unknown as ReturnType<typeof MaterialModel.findOne>);

    await expect(
      materialService.createMaterial({
        code: "MAT-CON-001",
        name: "Duplicate Material",
        category: "Cement",
        unit: "Bags",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("should throw NotFoundError if material does not exist by ID", async () => {
    vi.spyOn(MaterialModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof MaterialModel.findById>);

    await expect(
      materialService.getMaterialById("507f1f77bcf86cd799439099")
    ).rejects.toThrow(NotFoundError);
  });
});
