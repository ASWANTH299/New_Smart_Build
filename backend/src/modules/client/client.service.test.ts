import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { clientService } from "./client.service.js";
import { ProjectModel } from "../projects/project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";
import { DailyReport } from "../daily-reports/dailyReport.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { Issue } from "../issues/issue.model.js";
import { Budget } from "../budget/budget.model.js";
import { ForbiddenError, NotFoundError, BadRequestError } from "../../utils/AppError.js";

vi.mock("../projects/project.model.js");
vi.mock("../auth/projectMembership.model.js");
vi.mock("../milestones/milestone.model.js");
vi.mock("../daily-reports/dailyReport.model.js");
vi.mock("../tasks/task.model.js");
vi.mock("../issues/issue.model.js");
vi.mock("../budget/budget.model.js");

describe("ClientService Unit Tests (Phase 19 Client Portal)", () => {
  const clientId = new mongoose.Types.ObjectId().toString();
  const projectId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClientProjects", () => {
    it("should reject if clientId is missing", async () => {
      await expect(clientService.getClientProjects("")).rejects.toThrow(BadRequestError);
    });

    it("should return only projects assigned to the client user", async () => {
      const mockMemberships = [
        { projectId, userId: clientId, assignmentStatus: "ACTIVE" },
      ];

      vi.spyOn(ProjectMembershipModel, "find").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockMemberships),
        }),
      } as any);

      const mockProjects = [
        {
          _id: new mongoose.Types.ObjectId(projectId),
          code: "PRJ-001",
          name: "Apex Tower",
          description: "High rise commercial",
          location: "Downtown Metro",
          plannedStartDate: new Date("2026-01-01"),
          plannedEndDate: new Date("2027-01-01"),
          actualStartDate: new Date("2026-01-10"),
          actualEndDate: null,
          status: "ACTIVE",
          health: "HEALTHY",
          progress: 55,
        },
      ];

      vi.spyOn(ProjectModel, "find").mockReturnValue({
        sort: () => ({
          lean: () => ({
            exec: vi.fn().mockResolvedValue(mockProjects),
          }),
        }),
      } as any);

      const result = await clientService.getClientProjects(clientId, "CLIENT");

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("PRJ-001");
      expect(result[0].overallCompletionPercentage).toBe(55);
      expect(result[0].name).toBe("Apex Tower");
    });
  });

  describe("getClientProjectDetails", () => {
    it("should throw BadRequestError on invalid project ID", async () => {
      await expect(
        clientService.getClientProjectDetails("invalid-id", clientId, "CLIENT")
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if project is not found", async () => {
      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(
        clientService.getClientProjectDetails(projectId, clientId, "CLIENT")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError if client is not an assigned member or owner", async () => {
      const mockProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        code: "PRJ-001",
        name: "Apex Tower",
        status: "ACTIVE",
        clientUserId: new mongoose.Types.ObjectId(), // Different client
      };

      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockProject),
        }),
      } as any);

      vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(null), // No membership
        }),
      } as any);

      await expect(
        clientService.getClientProjectDetails(projectId, clientId, "CLIENT")
      ).rejects.toThrow(ForbiddenError);
    });

    it("should return curated client-safe project details for assigned client", async () => {
      const mockProject = {
        _id: new mongoose.Types.ObjectId(projectId),
        code: "PRJ-2026-001",
        name: "Apex Horizon Tower",
        description: "24-storey commercial office and retail complex",
        location: "Sector 62, Metro Corridor",
        plannedStartDate: new Date("2026-01-01"),
        plannedEndDate: new Date("2027-06-30"),
        actualStartDate: new Date("2026-01-15"),
        actualEndDate: null,
        status: "ACTIVE",
        health: "HEALTHY",
        progress: 45,
        clientUserId: new mongoose.Types.ObjectId(clientId),
      };

      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockProject),
        }),
      } as any);

      vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue({ userId: clientId, projectId }),
        }),
      } as any);

      // Mock Milestones
      const mockMilestones = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Substructure & Raft Handover",
          plannedDate: new Date("2026-04-30"),
          actualDate: new Date("2026-04-20"),
          status: "ACHIEVED",
          clientVisible: true,
          description: "Foundation signoff",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Level 10 Structural Topping Out",
          plannedDate: new Date("2026-10-15"),
          actualDate: null,
          status: "PENDING",
          clientVisible: true,
          description: "Mid-height structural completion",
        },
      ];

      vi.spyOn(MilestoneModel, "find").mockReturnValue({
        sort: () => ({
          lean: () => ({
            exec: vi.fn().mockResolvedValue(mockMilestones),
          }),
        }),
      } as any);

      // Mock Approved DPRs (Only approved DPRs, with work performed and photos)
      const mockDailyReports = [
        {
          _id: new mongoose.Types.ObjectId(),
          reportNumber: "DPR-20260930-001",
          reportDate: new Date("2026-09-30"),
          workPerformed: "Completed 5th floor column casting",
          photos: ["https://example.com/site-photo-1.jpg"],
          weatherCondition: "SUNNY",
          status: "APPROVED",
        },
      ];

      vi.spyOn(DailyReport, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => ({
              exec: vi.fn().mockResolvedValue(mockDailyReports),
            }),
          }),
        }),
      } as any);

      // Mock Tasks & Quality counts
      vi.spyOn(TaskModel, "countDocuments")
        .mockResolvedValueOnce(10 as any) // completedTasks
        .mockResolvedValueOnce(5 as any); // pendingTasks

      vi.spyOn(Issue, "countDocuments")
        .mockResolvedValueOnce(2 as any) // resolved quality issues
        .mockResolvedValueOnce(1 as any); // open quality issues

      // Mock Budget
      const mockBudget = {
        totalPlanned: 5000000,
        currency: "USD",
      };
      vi.spyOn(Budget, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockBudget),
        }),
      } as any);

      const result = await clientService.getClientProjectDetails(
        projectId,
        clientId,
        "CLIENT"
      );

      // Validate Project Metadata
      expect(result.project.code).toBe("PRJ-2026-001");
      expect(result.project.overallCompletionPercentage).toBe(45);
      expect(result.project.name).toBe("Apex Horizon Tower");

      // Validate Curated Milestones
      expect(result.milestones).toHaveLength(2);
      expect(result.milestones[0].title).toBe("Substructure & Raft Handover");
      expect(result.milestones[0].status).toBe("ACHIEVED");
      expect(result.milestones[0].completionPercentage).toBe(100);
      expect(result.milestones[1].status).toBe("PENDING");

      // Validate Approved DPRs (No labor wages / rates exposed)
      expect(result.dailySiteProgress).toHaveLength(1);
      expect(result.dailySiteProgress[0].reportNumber).toBe("DPR-20260930-001");
      expect(result.dailySiteProgress[0].photos).toContain(
        "https://example.com/site-photo-1.jpg"
      );

      // Validate Quality Checkpoint Summary
      // passed = 10 tasks + 2 issues + 1 achieved milestone = 13
      // pending = 5 tasks + 1 issue + 1 pending milestone = 7
      // total = 20, passPercentage = 65%
      expect(result.qualityInspectionSummary.passedCheckpoints).toBe(13);
      expect(result.qualityInspectionSummary.pendingCheckpoints).toBe(7);
      expect(result.qualityInspectionSummary.totalCheckpoints).toBe(20);
      expect(result.qualityInspectionSummary.passPercentage).toBe(65);

      // Validate Financial / Payment Milestones Summary
      expect(result.financialSummary.totalBudget).toBe(5000000);
      expect(result.financialSummary.paymentMilestones).toHaveLength(2);
      expect(result.financialSummary.paymentMilestones[0].status).toBe("PAID");
      expect(result.financialSummary.paymentMilestones[0].isPaid).toBe(true);
      expect(result.financialSummary.paidPercentage).toBe(50);
    });
  });
});
