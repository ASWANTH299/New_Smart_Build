import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { equipmentService } from "./equipment.service.js";
import { Equipment } from "./equipment.model.js";
import { EquipmentAssignment } from "./equipmentAssignment.model.js";
import { EquipmentMaintenance } from "./equipmentMaintenance.model.js";
import { EquipmentInspection } from "./equipmentInspection.model.js";
import { AppError } from "../../utils/AppError.js";

vi.mock("./equipment.model.js");
vi.mock("./equipmentAssignment.model.js");
vi.mock("./equipmentMaintenance.model.js");
vi.mock("./equipmentInspection.model.js");

describe("EquipmentService Unit Tests (Phase 11)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const equipmentId = new mongoose.Types.ObjectId().toString();
  const actorId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEquipment", () => {
    it("should create new equipment master record", async () => {
      vi.spyOn(Equipment, "findOne").mockResolvedValue(null);

      (Equipment as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(equipmentId),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      }));

      const result = await equipmentService.createEquipment({
        code: "EQ-EXC-001",
        name: "CAT 320 Hydraulic Excavator",
        category: "EARTHMOVING",
        ownershipType: "OWNED",
      });

      expect(result.code).toBe("EQ-EXC-001");
      expect(result.name).toBe("CAT 320 Hydraulic Excavator");
      expect(result.category).toBe("EARTHMOVING");
    });

    it("should reject duplicate equipment code with conflict error", async () => {
      vi.spyOn(Equipment, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(equipmentId),
        code: "EQ-EXC-001",
      } as any);

      await expect(
        equipmentService.createEquipment({
          code: "EQ-EXC-001",
          name: "Duplicate Excavator",
          category: "EARTHMOVING",
        })
      ).rejects.toThrow("already exists");
    });
  });

  describe("assignEquipment & Conflict Detection", () => {
    it("should reject assignment if equipment is UNDER_MAINTENANCE", async () => {
      vi.spyOn(Equipment, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(equipmentId),
        name: "CAT Excavator",
        code: "EQ-01",
        status: "UNDER_MAINTENANCE",
      } as any);

      await expect(
        equipmentService.assignEquipment(
          projectId,
          {
            equipmentId,
            startDate: "2026-09-10",
            endDate: "2026-09-20",
          },
          actorId
        )
      ).rejects.toThrow("cannot be assigned");
    });

    it("should reject assignment if schedule conflict exists with an overlapping active assignment", async () => {
      vi.spyOn(Equipment, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(equipmentId),
        name: "CAT Excavator",
        code: "EQ-01",
        status: "AVAILABLE",
      } as any);

      // Mock overlapping assignment found
      vi.spyOn(EquipmentAssignment, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          projectId: { name: "Project Alpha", code: "PRJ-001" },
          startDate: new Date("2026-09-05"),
          endDate: new Date("2026-09-15"),
          status: "ACTIVE",
        }),
      } as any);

      await expect(
        equipmentService.assignEquipment(
          projectId,
          {
            equipmentId,
            startDate: "2026-09-10",
            endDate: "2026-09-20",
          },
          actorId
        )
      ).rejects.toThrow("Schedule Conflict");
    });

    it("should assign equipment when available and no schedule conflict", async () => {
      const mockEquipment = {
        _id: new mongoose.Types.ObjectId(equipmentId),
        name: "CAT Excavator",
        code: "EQ-01",
        status: "AVAILABLE",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Equipment, "findById").mockResolvedValue(mockEquipment as any);

      vi.spyOn(EquipmentAssignment, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        equipmentId: { code: "EQ-01", name: "CAT Excavator" },
        projectId,
        startDate: new Date("2026-09-10"),
        endDate: new Date("2026-09-20"),
        status: "ACTIVE",
      });

      (EquipmentAssignment as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      }));

      const result = await equipmentService.assignEquipment(
        projectId,
        {
          equipmentId,
          startDate: "2026-09-10",
          endDate: "2026-09-20",
        },
        actorId
      );

      expect(mockEquipment.status).toBe("ASSIGNED");
      expect(result.status).toBe("ACTIVE");
      expect(mockEquipment.save).toHaveBeenCalled();
    });
  });

  describe("reportBreakdown", () => {
    it("should transition equipment to BREAKDOWN and log emergency maintenance ticket", async () => {
      const mockEquipment = {
        _id: new mongoose.Types.ObjectId(equipmentId),
        name: "Concrete Pump Truck",
        status: "ASSIGNED",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Equipment, "findById").mockResolvedValue(mockEquipment as any);

      (EquipmentMaintenance as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      }));

      const result = await equipmentService.reportBreakdown(
        equipmentId,
        {
          description: "Hydraulic cylinder ruptured during pour",
        },
        actorId
      );

      expect(result.equipment.status).toBe("BREAKDOWN");
      expect(result.maintenance.type).toBe("BREAKDOWN");
      expect(result.maintenance.status).toBe("IN_PROGRESS");
    });
  });

  describe("completeMaintenance & Inspection Lifecycle", () => {
    it("should complete maintenance and restore status when all maintenance finished", async () => {
      const mockMaintenance = {
        _id: new mongoose.Types.ObjectId(),
        equipmentId: new mongoose.Types.ObjectId(equipmentId),
        status: "IN_PROGRESS",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(EquipmentMaintenance, "findOne").mockResolvedValue(mockMaintenance as any);
      vi.spyOn(EquipmentMaintenance, "countDocuments").mockResolvedValue(0);
      vi.spyOn(EquipmentAssignment, "countDocuments").mockResolvedValue(0);

      const mockEquipment = {
        _id: new mongoose.Types.ObjectId(equipmentId),
        status: "UNDER_MAINTENANCE",
        maintenanceSchedule: { frequencyMonths: 6, lastServiceDate: null },
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Equipment, "findById").mockResolvedValue(mockEquipment as any);

      await equipmentService.completeMaintenance(equipmentId, mockMaintenance._id.toString(), {
        status: "COMPLETED",
        cost: 15000,
      });

      expect(mockMaintenance.status).toBe("COMPLETED");
      expect(mockEquipment.status).toBe("AVAILABLE");
      expect(mockEquipment.save).toHaveBeenCalled();
    });
  });
});
