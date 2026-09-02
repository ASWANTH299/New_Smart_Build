import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import { Equipment } from "./equipment.model.js";
import { EquipmentAssignment } from "./equipmentAssignment.model.js";
import { UserModel } from "../users/user.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

vi.mock("./equipment.model.js");
vi.mock("./equipmentAssignment.model.js");
vi.mock("./equipmentMaintenance.model.js");
vi.mock("./equipmentInspection.model.js");
vi.mock("../users/user.model.js");
vi.mock("../projects/project.model.js");
vi.mock("../auth/projectMembership.model.js");

describe("Equipment & Asset API Integration Tests (Phase 11)", () => {
  const app = createApp();

  const adminId = "507f1f77bcf86cd799439001";
  const engineerId = "507f1f77bcf86cd799439002";
  const projectId = "507f1f77bcf86cd799439011";
  const equipmentId = "507f1f77bcf86cd799439031";

  const adminToken = generateJwtToken({
    userId: adminId,
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  const engineerToken = generateJwtToken({
    userId: engineerId,
    email: "engineer@smartbuild.com",
    role: "SITE_ENGINEER",
  });

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, "findById").mockImplementation((id: any) => {
      const isAdm = id.toString() === adminId;
      return {
        exec: vi.fn().mockResolvedValue({
          _id: id,
          firstName: isAdm ? "Admin" : "Site",
          lastName: isAdm ? "User" : "Engineer",
          email: isAdm ? "admin@smartbuild.com" : "engineer@smartbuild.com",
          primaryRole: isAdm ? "ADMIN" : "SITE_ENGINEER",
          status: "ACTIVE",
          tokenVersion: 0,
        }),
      } as any;
    });

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        userId: engineerId,
        assignmentStatus: "ACTIVE",
      }),
    } as any);

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: projectId,
        status: "ACTIVE",
      }),
    } as any);
  });

  describe("POST /api/v1/equipment", () => {
    it("should allow ADMIN to create equipment master record", async () => {
      vi.spyOn(Equipment, "findOne").mockResolvedValue(null);

      (Equipment as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(equipmentId),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      }));

      const res = await request(app)
        .post("/api/v1/equipment")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "EQ-CRANE-01",
          name: "50-Ton Tower Crane",
          category: "MATERIAL_HANDLING",
          ownershipType: "OWNED",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("EQ-CRANE-01");
    });
  });

  describe("POST /api/v1/projects/:projectId/equipment/assignments", () => {
    it("should allow ADMIN to assign equipment when available", async () => {
      const mockEquipment = {
        _id: new mongoose.Types.ObjectId(equipmentId),
        code: "EQ-CRANE-01",
        name: "50-Ton Tower Crane",
        status: "AVAILABLE",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Equipment, "findById").mockResolvedValue(mockEquipment as any);

      vi.spyOn(EquipmentAssignment, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        equipmentId: { code: "EQ-CRANE-01", name: "50-Ton Tower Crane" },
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

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/equipment/assignments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          equipmentId,
          startDate: "2026-09-10",
          endDate: "2026-09-20",
          purpose: "High-rise structural steel lifting",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
