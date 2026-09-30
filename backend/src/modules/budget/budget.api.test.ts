import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import { Budget } from "./budget.model.js";
import { Expense } from "./expense.model.js";
import { BudgetChangeRequest } from "./budgetChangeRequest.model.js";
import { UserModel } from "../users/user.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { generateJwtToken } from "../../utils/jwt.js";

vi.mock("./budget.model.js");
vi.mock("./expense.model.js");
vi.mock("./budgetChangeRequest.model.js");
vi.mock("../users/user.model.js");
vi.mock("../projects/project.model.js");
vi.mock("../auth/projectMembership.model.js");
vi.mock("../audit/auditLog.model.js", () => ({
  logAuditAction: vi.fn().mockResolvedValue({}),
}));

describe("Budget & Expense API Integration Tests (Phase 12)", () => {
  const app = createApp();

  const adminId = "507f1f77bcf86cd799439001";
  const pmId = "507f1f77bcf86cd799439002";
  const engineerId = "507f1f77bcf86cd799439003";
  const projectId = "507f1f77bcf86cd799439011";
  const budgetId = "507f1f77bcf86cd799439021";
  const expenseId = "507f1f77bcf86cd799439031";

  const adminToken = generateJwtToken({
    userId: adminId,
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  const pmToken = generateJwtToken({
    userId: pmId,
    email: "pm@smartbuild.com",
    role: "PROJECT_MANAGER",
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
      const isPM = id.toString() === pmId;
      return {
        exec: vi.fn().mockResolvedValue({
          _id: id,
          firstName: isAdm ? "Admin" : isPM ? "PM" : "Site",
          lastName: isAdm ? "User" : isPM ? "Manager" : "Engineer",
          email: isAdm
            ? "admin@smartbuild.com"
            : isPM
            ? "pm@smartbuild.com"
            : "engineer@smartbuild.com",
          primaryRole: isAdm ? "ADMIN" : isPM ? "PROJECT_MANAGER" : "SITE_ENGINEER",
          status: "ACTIVE",
          tokenVersion: 0,
        }),
      } as any;
    });

    vi.spyOn(ProjectMembershipModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        userId: pmId,
        assignmentStatus: "ACTIVE",
      }),
    } as any);

    vi.spyOn(ProjectModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: projectId,
        status: "ACTIVE",
        projectManagerId: pmId,
      }),
    } as any);
  });

  describe("GET /api/v1/projects/:projectId/budget/summary", () => {
    it("should return budget summary with financial KPI metrics", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 500000,
        totalActual: 150000,
        totalCommitted: 20000,
        variance: 350000,
        categories: [
          { category: "MATERIAL", plannedAmount: 250000, actualAmount: 80000, committedAmount: 10000, variance: 170000 },
          { category: "WORKFORCE", plannedAmount: 150000, actualAmount: 50000, committedAmount: 10000, variance: 100000 },
          { category: "EQUIPMENT", plannedAmount: 70000, actualAmount: 20000, committedAmount: 0, variance: 50000 },
          { category: "OTHER", plannedAmount: 30000, actualAmount: 0, committedAmount: 0, variance: 30000 },
        ],
      };

      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);
      vi.spyOn(Expense, "find").mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);
      vi.spyOn(BudgetChangeRequest, "countDocuments").mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/budget/summary`)
        .set("Authorization", `Bearer ${pmToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalPlanned).toBe(500000);
      expect(res.body.data.metrics.totalActual).toBe(150000);
      expect(res.body.data.metrics.remainingBudget).toBe(350000);
      expect(res.body.data.categoryBreakdown.length).toBe(4);
    });
  });

  describe("PUT /api/v1/projects/:projectId/budget", () => {
    it("should allow PM to update budget plan allocations", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 0,
        totalActual: 0,
        totalCommitted: 0,
        variance: 0,
        categories: [
          { category: "MATERIAL", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
          { category: "WORKFORCE", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
          { category: "EQUIPMENT", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
          { category: "OTHER", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
        ],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);

      const res = await request(app)
        .put(`/api/v1/projects/${projectId}/budget`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          categories: [
            { category: "MATERIAL", plannedAmount: 200000 },
            { category: "WORKFORCE", plannedAmount: 100000 },
            { category: "EQUIPMENT", plannedAmount: 50000 },
            { category: "OTHER", plannedAmount: 20000 },
          ],
          notes: "Approved Phase Baseline",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPlanned).toBe(370000);
    });
  });

  describe("POST /api/v1/projects/:projectId/expenses", () => {
    it("should allow SITE_ENGINEER / PM / ADMIN to log expense and auto-rollup", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 100000,
        totalActual: 0,
        totalCommitted: 0,
        variance: 100000,
        categories: [
          { category: "MATERIAL", plannedAmount: 50000, actualAmount: 0, committedAmount: 0, variance: 50000 },
          { category: "WORKFORCE", plannedAmount: 30000, actualAmount: 0, committedAmount: 0, variance: 30000 },
          { category: "EQUIPMENT", plannedAmount: 15000, actualAmount: 0, committedAmount: 0, variance: 15000 },
          { category: "OTHER", plannedAmount: 5000, actualAmount: 0, committedAmount: 0, variance: 5000 },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);

      const mockPopulate = vi.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(expenseId),
        projectId,
        category: "MATERIAL",
        description: "Rebar Steel 12mm 500kg",
        amount: 32000,
        status: "APPROVED",
      });

      (Expense as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(expenseId),
        save: vi.fn().mockResolvedValue(true),
        populate: mockPopulate,
      }));

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/expenses`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          category: "MATERIAL",
          description: "Rebar Steel 12mm 500kg",
          amount: 32000,
          status: "APPROVED",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockBudget.totalActual).toBe(32000);
      expect(mockBudget.variance).toBe(68000);
    });
  });
});
