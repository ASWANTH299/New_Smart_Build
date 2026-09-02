import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { workforceService } from "./workforce.service.js";
import { Worker } from "./worker.model.js";
import { WorkforceAssignment } from "./workforceAssignment.model.js";

vi.mock("./worker.model.js");
vi.mock("./workforceAssignment.model.js");

describe("WorkforceService Unit Tests (Phase 10)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const workerId = new mongoose.Types.ObjectId().toString();
  const actorId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWorker", () => {
    it("should create and return worker record", async () => {
      (Worker as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(workerId),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      }));

      const result = await workforceService.createWorker({
        name: "Ramesh Kumar",
        trade: "MASON",
        workerType: "DIRECT",
        contact: { phone: "+91 9876543210" },
      });

      expect(result.name).toBe("Ramesh Kumar");
      expect(result.trade).toBe("MASON");
      expect(result.workerType).toBe("DIRECT");
    });
  });

  describe("assignWorker", () => {
    it("should assign worker to project and task", async () => {
      vi.spyOn(Worker, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(workerId),
        name: "Ramesh Kumar",
      } as any);

      vi.spyOn(WorkforceAssignment, "findOne").mockResolvedValue(null);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        workerId: { name: "Ramesh Kumar", trade: "MASON" },
        status: "ACTIVE",
      });

      (WorkforceAssignment as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      }));

      const result = await workforceService.assignWorker(
        projectId,
        {
          workerId,
          startDate: new Date(),
        },
        actorId
      );

      expect(result.status).toBe("ACTIVE");
      expect(mockPopulate).toHaveBeenCalled();
    });

    it("should throw conflict error if worker is already actively assigned to same project/task", async () => {
      vi.spyOn(Worker, "findById").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(workerId),
        name: "Ramesh Kumar",
      } as any);

      vi.spyOn(WorkforceAssignment, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: "ACTIVE",
      } as any);

      await expect(
        workforceService.assignWorker(
          projectId,
          {
            workerId,
          },
          actorId
        )
      ).rejects.toThrow("Worker is already actively assigned");
    });
  });
});
