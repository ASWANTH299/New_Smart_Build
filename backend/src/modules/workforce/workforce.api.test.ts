import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import { Worker } from "./worker.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { UserModel } from "../users/user.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

vi.mock("./worker.model.js");
vi.mock("./workforceAssignment.model.js");
vi.mock("../attendance/attendance.model.js");
vi.mock("../users/user.model.js");
vi.mock("../projects/project.model.js");
vi.mock("../auth/projectMembership.model.js");

describe("Workforce & Attendance API Integration Tests (Phase 10)", () => {
  const app = createApp();

  const adminId = "507f1f77bcf86cd799439001";
  const engineerId = "507f1f77bcf86cd799439002";
  const projectId = "507f1f77bcf86cd799439011";
  const workerId = "507f1f77bcf86cd799439021";

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

  describe("POST /api/v1/workforce", () => {
    it("should allow ADMIN to create worker master record", async () => {
      (Worker as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(workerId),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      }));

      const res = await request(app)
        .post("/api/v1/workforce")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Mohan Lal",
          trade: "ELECTRICIAN",
          workerType: "DIRECT",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Mohan Lal");
    });
  });

  describe("POST /api/v1/projects/:projectId/attendance", () => {
    it("should allow SITE_ENGINEER to log daily attendance", async () => {
      vi.spyOn(Worker, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(workerId),
        name: "Mohan Lal",
      } as any);

      vi.spyOn(Attendance, "findOne").mockResolvedValue(null);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        workerId: { name: "Mohan Lal" },
        date: "2026-09-02",
        status: "PRESENT",
        workingHours: 8,
        overtimeHours: 0,
      });

      (Attendance as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      }));

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/attendance`)
        .set("Authorization", `Bearer ${engineerToken}`)
        .send({
          workerId,
          date: "2026-09-02",
          status: "PRESENT",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
