import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { issueService } from "./issue.service.js";
import { Issue } from "./issue.model.js";

vi.mock("./issue.model.js");

describe("IssueService Unit Tests (Phase 13)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const assigneeId = new mongoose.Types.ObjectId().toString();
  const issueId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createIssue", () => {
    it("should create an issue with generated issueNumber and OPEN status", async () => {
      vi.spyOn(Issue, "countDocuments").mockResolvedValue(0 as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(issueId),
        projectId: new mongoose.Types.ObjectId(projectId),
        issueNumber: "ISS-0001",
        title: "Rebar tie failure on Column C3",
        description: "Rebar cages shifted during pour setup",
        category: "QUALITY",
        priority: "HIGH",
        status: "OPEN",
        reportedBy: { _id: userId, name: "Site Engineer" },
        assignedTo: { _id: assigneeId, name: "QA Engineer" },
      });

      const mockSave = vi.fn().mockResolvedValue(true);

      (Issue as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
        populate: mockPopulate,
      }));

      const result = await issueService.createIssue(
        projectId,
        {
          title: "Rebar tie failure on Column C3",
          description: "Rebar cages shifted during pour setup",
          category: "QUALITY",
          priority: "HIGH",
          assignedTo: assigneeId,
        },
        userId
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe("OPEN");
      expect(result.priority).toBe("HIGH");
      expect(result.category).toBe("QUALITY");
    });
  });

  describe("getIssuesByProject", () => {
    it("should retrieve filtered issues list for project", async () => {
      const mockIssues = [
        {
          _id: new mongoose.Types.ObjectId(issueId),
          issueNumber: "ISS-0001",
          title: "Hydraulic oil leak on Excavator 2",
          category: "EQUIPMENT",
          priority: "CRITICAL",
          status: "OPEN",
        },
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockImplementation(function (this: any) {
          return this;
        }),
      };
      mockQuery.populate = vi
        .fn()
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockIssues as any);

      vi.spyOn(Issue, "find").mockReturnValue(mockQuery as any);
      vi.spyOn(Issue, "countDocuments").mockResolvedValue(1 as any);

      const result = await issueService.getIssuesByProject(projectId, {
        status: "OPEN",
        priority: "CRITICAL",
      });

      expect(result.issues).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("resolveIssue & closeIssue", () => {
    it("should mark issue as RESOLVED with resolution notes", async () => {
      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(issueId),
        status: "RESOLVED",
        resolutionNotes: "Tightened hydraulic fittings and topped up fluids",
        resolvedAt: new Date(),
      });

      const mockIssueDoc: any = {
        _id: new mongoose.Types.ObjectId(issueId),
        status: "OPEN",
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      };

      vi.spyOn(Issue, "findOne").mockResolvedValue(mockIssueDoc);

      const result = await issueService.resolveIssue(
        projectId,
        issueId,
        "Tightened hydraulic fittings and topped up fluids",
        userId
      );

      expect(mockIssueDoc.status).toBe("RESOLVED");
      expect(mockIssueDoc.resolutionNotes).toBe("Tightened hydraulic fittings and topped up fluids");
      expect(mockIssueDoc.resolvedAt).toBeInstanceOf(Date);
      expect(mockIssueDoc.save).toHaveBeenCalled();
      expect(result.status).toBe("RESOLVED");
    });
  });
});
