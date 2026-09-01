import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectService } from "./project.service.js";
import { ProjectModel, IProject } from "./project.model.js";
import { ProjectMembershipModel, IProjectMembership } from "../auth/projectMembership.model.js";
import { UserModel } from "../users/user.model.js";
import { AuditLogModel, IAuditLog } from "../audit/auditLog.model.js";
import { ConflictError, BadRequestError } from "../../utils/AppError.js";

describe("ProjectService & Lifecycle State Machine Tests (Phase 6)", () => {
  let projectService: ProjectService;

  beforeEach(() => {
    projectService = new ProjectService();
    vi.restoreAllMocks();
  });

  it("should create project and assign PM/creator to memberships", async () => {
    vi.spyOn(ProjectModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOne>);

    const mockProject = {
      _id: "507f1f77bcf86cd799439011",
      code: "PRJ-BLR-001",
      name: "Metro Tower",
      status: "PLANNING",
      health: "HEALTHY",
      progress: 0,
      plannedStartDate: new Date("2026-09-01"),
      plannedEndDate: new Date("2027-09-01"),
    };

    vi.spyOn(ProjectModel, "create").mockResolvedValue(mockProject as unknown as IProject);
    vi.spyOn(ProjectMembershipModel, "insertMany").mockResolvedValue([] as unknown as IProjectMembership[]);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await projectService.createProject(
      {
        code: "PRJ-BLR-001",
        name: "Metro Tower",
        location: "Bengaluru",
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2027-09-01",
        projectManagerId: "507f1f77bcf86cd799439012",
      },
      "507f1f77bcf86cd799439013"
    );

    expect(result.code).toBe("PRJ-BLR-001");
    expect(ProjectMembershipModel.insertMany).toHaveBeenCalled();
    expect(AuditLogModel.create).toHaveBeenCalled();
  });

  it("should add a registered user to project team", async () => {
    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439099",
        name: "Site Eng Amit",
        email: "amit@site.com",
        primaryRole: "SITE_ENGINEER",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);

    vi.spyOn(ProjectMembershipModel, "findOneAndUpdate").mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    const result = await projectService.addTeamMember(
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439099",
      "507f1f77bcf86cd799439013"
    );

    expect(result.user.name).toBe("Site Eng Amit");
    expect(ProjectMembershipModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it("should remove a team member from project", async () => {
    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
    } as unknown as ReturnType<typeof ProjectModel.findById>);

    const mockMembership = {
      assignmentStatus: "ACTIVE",
      removedAt: null,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockMembership),
    } as unknown as ReturnType<typeof ProjectMembershipModel.findOne>);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

    await projectService.removeTeamMember(
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439099",
      "507f1f77bcf86cd799439013"
    );

    expect(mockMembership.assignmentStatus).toBe("REMOVED");
    expect(mockMembership.save).toHaveBeenCalled();
  });

  it("should reject duplicate project code with ConflictError", async () => {
    vi.spyOn(ProjectModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: "existing-proj" }),
    } as unknown as ReturnType<typeof ProjectModel.findOne>);

    await expect(
      projectService.createProject(
        {
          code: "DUPLICATE-CODE",
          name: "Metro Tower 2",
          location: "Bengaluru",
          plannedStartDate: "2026-09-01",
          plannedEndDate: "2027-09-01",
          projectManagerId: "507f1f77bcf86cd799439012",
        },
        "507f1f77bcf86cd799439013"
      )
    ).rejects.toThrow(ConflictError);
  });

  describe("Lifecycle State Machine Validation", () => {
    it("should allow valid transitions: PLANNING -> ACTIVE -> ON_HOLD -> ACTIVE -> COMPLETED -> ARCHIVED", async () => {
      const mockProject = {
        _id: "507f1f77bcf86cd799439011",
        status: "PLANNING",
        actualStartDate: null as Date | null,
        actualEndDate: null as Date | null,
        archivedAt: null as Date | null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockProject),
      } as unknown as ReturnType<typeof ProjectModel.findById>);
      vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as unknown as IAuditLog);

      // 1. PLANNING -> ACTIVE
      await projectService.updateProjectStatus("507f1f77bcf86cd799439011", "ACTIVE", "user-1");
      expect(mockProject.status).toBe("ACTIVE");
      expect(mockProject.actualStartDate).not.toBeNull();

      // 2. ACTIVE -> ON_HOLD
      await projectService.updateProjectStatus("507f1f77bcf86cd799439011", "ON_HOLD", "user-1");
      expect(mockProject.status).toBe("ON_HOLD");

      // 3. ON_HOLD -> ACTIVE
      await projectService.updateProjectStatus("507f1f77bcf86cd799439011", "ACTIVE", "user-1");
      expect(mockProject.status).toBe("ACTIVE");

      // 4. ACTIVE -> COMPLETED
      await projectService.updateProjectStatus("507f1f77bcf86cd799439011", "COMPLETED", "user-1");
      expect(mockProject.status).toBe("COMPLETED");
      expect(mockProject.actualEndDate).not.toBeNull();

      // 5. COMPLETED -> ARCHIVED
      await projectService.updateProjectStatus("507f1f77bcf86cd799439011", "ARCHIVED", "user-1");
      expect(mockProject.status).toBe("ARCHIVED");
      expect(mockProject.archivedAt).not.toBeNull();
    });

    it("should reject invalid state transitions with BadRequestError", async () => {
      const mockProject = {
        _id: "507f1f77bcf86cd799439011",
        status: "COMPLETED",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(ProjectModel, "findById").mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockProject),
      } as unknown as ReturnType<typeof ProjectModel.findById>);

      // COMPLETED cannot revert to PLANNING or ACTIVE
      await expect(
        projectService.updateProjectStatus("507f1f77bcf86cd799439011", "PLANNING", "user-1")
      ).rejects.toThrow(BadRequestError);

      await expect(
        projectService.updateProjectStatus("507f1f77bcf86cd799439011", "ACTIVE", "user-1")
      ).rejects.toThrow(BadRequestError);
    });
  });
});
