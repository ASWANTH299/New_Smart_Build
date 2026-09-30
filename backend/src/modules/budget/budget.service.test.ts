import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { budgetService } from "./budget.service.js";
import { Budget } from "./budget.model.js";
import { Expense } from "./expense.model.js";
import { BudgetChangeRequest } from "./budgetChangeRequest.model.js";
import { ProjectModel } from "../projects/project.model.js";

vi.mock("./budget.model.js");
vi.mock("./expense.model.js");
vi.mock("./budgetChangeRequest.model.js");
vi.mock("../projects/project.model.js");
vi.mock("../audit/auditLog.model.js", () => ({
  logAuditAction: vi.fn().mockResolvedValue({}),
}));

describe("BudgetService Unit Tests (Phase 12: Budget & Expense Management)", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const actorId = new mongoose.Types.ObjectId().toString();
  const budgetId = new mongoose.Types.ObjectId().toString();
  const expenseId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateProjectBudget", () => {
    it("should return existing budget if one exists", async () => {
      vi.spyOn(ProjectModel, "findById").mockResolvedValue({
        _id: projectId,
        projectManagerId: new mongoose.Types.ObjectId(actorId),
      } as any);

      const existingBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        totalPlanned: 500000,
        totalActual: 120000,
        variance: 380000,
        categories: [
          { category: "MATERIAL", plannedAmount: 200000, actualAmount: 60000, variance: 140000 },
          { category: "WORKFORCE", plannedAmount: 150000, actualAmount: 40000, variance: 110000 },
          { category: "EQUIPMENT", plannedAmount: 100000, actualAmount: 20000, variance: 80000 },
          { category: "OTHER", plannedAmount: 50000, actualAmount: 0, variance: 50000 },
        ],
      };

      vi.spyOn(Budget, "findOne").mockResolvedValue(existingBudget as any);

      const result = await budgetService.getOrCreateProjectBudget(projectId, actorId);
      expect(result.totalPlanned).toBe(500000);
      expect(result.variance).toBe(380000);
    });

    it("should initialize default 4 categories if no budget exists", async () => {
      vi.spyOn(ProjectModel, "findById").mockResolvedValue({
        _id: projectId,
        projectManagerId: new mongoose.Types.ObjectId(actorId),
      } as any);

      vi.spyOn(Budget, "findOne").mockResolvedValue(null);

      (Budget as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(budgetId),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      }));

      const result = await budgetService.getOrCreateProjectBudget(projectId, actorId);
      expect(result.categories.length).toBe(4);
      expect(result.categories.map((c: any) => c.category)).toEqual([
        "MATERIAL",
        "WORKFORCE",
        "EQUIPMENT",
        "OTHER",
      ]);
      expect(result.totalPlanned).toBe(0);
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("updateBudgetPlan & Variance Calculation", () => {
    it("should accurately update category planned allocations and compute overall project variance", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 0,
        totalActual: 50000,
        totalCommitted: 0,
        variance: -50000,
        categories: [
          { category: "MATERIAL", plannedAmount: 0, actualAmount: 30000, committedAmount: 0, variance: -30000 },
          { category: "WORKFORCE", plannedAmount: 0, actualAmount: 20000, committedAmount: 0, variance: -20000 },
          { category: "EQUIPMENT", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
          { category: "OTHER", plannedAmount: 0, actualAmount: 0, committedAmount: 0, variance: 0 },
        ],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue({ _id: projectId } as any);
      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);

      const updated = await budgetService.updateBudgetPlan(
        projectId,
        [
          { category: "MATERIAL", plannedAmount: 250000 },
          { category: "WORKFORCE", plannedAmount: 150000 },
          { category: "EQUIPMENT", plannedAmount: 80000 },
          { category: "OTHER", plannedAmount: 20000 },
        ],
        "Q3 Initial Allocation",
        actorId
      );

      expect(updated.totalPlanned).toBe(500000); // 250k + 150k + 80k + 20k
      expect(updated.totalActual).toBe(50000);
      expect(updated.variance).toBe(450000); // 500k - 50k

      const mat = updated.categories.find((c: any) => c.category === "MATERIAL");
      expect(mat?.plannedAmount).toBe(250000);
      expect(mat?.variance).toBe(220000); // 250k - 30k
      expect(mockBudget.save).toHaveBeenCalled();
    });
  });

  describe("recordExpense & Auto-Rollup", () => {
    it("should create expense and roll up amounts into category actuals and total variance", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        totalPlanned: 100000,
        totalActual: 10000,
        totalCommitted: 0,
        variance: 90000,
        categories: [
          { category: "MATERIAL", plannedAmount: 50000, actualAmount: 10000, committedAmount: 0, variance: 40000 },
          { category: "WORKFORCE", plannedAmount: 30000, actualAmount: 0, committedAmount: 0, variance: 30000 },
          { category: "EQUIPMENT", plannedAmount: 15000, actualAmount: 0, committedAmount: 0, variance: 15000 },
          { category: "OTHER", plannedAmount: 5000, actualAmount: 0, committedAmount: 0, variance: 5000 },
        ],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue({ _id: projectId } as any);
      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);

      (Expense as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(expenseId),
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({
          ...data,
          _id: new mongoose.Types.ObjectId(expenseId),
        }),
      }));

      const expense = await budgetService.recordExpense(
        projectId,
        {
          category: "MATERIAL",
          description: "50 Bags OPC 53 Grade Cement",
          amount: 17500,
          status: "APPROVED",
        },
        actorId
      );

      expect(expense.amount).toBe(17500);
      expect(mockBudget.totalActual).toBe(27500); // 10000 + 17500
      expect(mockBudget.variance).toBe(72500); // 100000 - 27500

      const matCat = mockBudget.categories.find((c: any) => c.category === "MATERIAL");
      expect(matCat?.actualAmount).toBe(27500);
      expect(matCat?.variance).toBe(22500); // 50000 - 27500
      expect(mockBudget.save).toHaveBeenCalled();
    });
  });

  describe("deleteExpense & Budget Reversal", () => {
    it("should deduct expense amount from budget category and total actuals when deleted", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        totalPlanned: 100000,
        totalActual: 30000,
        totalCommitted: 0,
        variance: 70000,
        categories: [
          { category: "MATERIAL", plannedAmount: 50000, actualAmount: 20000, committedAmount: 0, variance: 30000 },
          { category: "WORKFORCE", plannedAmount: 30000, actualAmount: 10000, committedAmount: 0, variance: 20000 },
          { category: "EQUIPMENT", plannedAmount: 15000, actualAmount: 0, committedAmount: 0, variance: 15000 },
          { category: "OTHER", plannedAmount: 5000, actualAmount: 0, committedAmount: 0, variance: 5000 },
        ],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue({ _id: projectId } as any);
      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);

      vi.spyOn(Expense, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(expenseId),
        projectId: new mongoose.Types.ObjectId(projectId),
        category: "MATERIAL",
        amount: 8000,
        status: "APPROVED",
      } as any);

      vi.spyOn(Expense, "findByIdAndDelete").mockResolvedValue({} as any);

      await budgetService.deleteExpense(projectId, expenseId, actorId);

      expect(mockBudget.totalActual).toBe(22000); // 30000 - 8000
      expect(mockBudget.variance).toBe(78000); // 100000 - 22000

      const matCat = mockBudget.categories.find((c: any) => c.category === "MATERIAL");
      expect(matCat?.actualAmount).toBe(12000); // 20000 - 8000
      expect(matCat?.variance).toBe(38000); // 50000 - 12000
      expect(mockBudget.save).toHaveBeenCalled();
    });
  });

  describe("createBudgetChangeRequest & Approval Workflow", () => {
    it("should create change request and on ADMIN approval bump version and update allocations", async () => {
      const mockBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 400000,
        totalActual: 100000,
        totalCommitted: 0,
        variance: 300000,
        categories: [
          { category: "MATERIAL", plannedAmount: 200000, actualAmount: 70000, committedAmount: 0, variance: 130000 },
          { category: "WORKFORCE", plannedAmount: 100000, actualAmount: 30000, committedAmount: 0, variance: 70000 },
          { category: "EQUIPMENT", plannedAmount: 70000, actualAmount: 0, committedAmount: 0, variance: 70000 },
          { category: "OTHER", plannedAmount: 30000, actualAmount: 0, committedAmount: 0, variance: 30000 },
        ],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(ProjectModel, "findById").mockResolvedValue({ _id: projectId } as any);
      vi.spyOn(Budget, "findOne").mockResolvedValue(mockBudget as any);
      vi.spyOn(Budget, "findById").mockResolvedValue(mockBudget as any);

      const requestId = new mongoose.Types.ObjectId().toString();
      const mockChangeRequest = {
        _id: new mongoose.Types.ObjectId(requestId),
        projectId: new mongoose.Types.ObjectId(projectId),
        budgetId: new mongoose.Types.ObjectId(budgetId),
        status: "PENDING",
        currentBudget: 400000,
        requestedChange: 100000,
        proposedBudget: 500000,
        categoryChanges: [
          { category: "MATERIAL", currentPlanned: 200000, proposedPlanned: 260000, changeAmount: 60000 },
          { category: "WORKFORCE", currentPlanned: 100000, proposedPlanned: 140000, changeAmount: 40000 },
        ],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      (BudgetChangeRequest as unknown as vi.Mock).mockImplementation((data: any) => ({
        ...data,
        _id: new mongoose.Types.ObjectId(requestId),
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(mockChangeRequest),
      }));

      // 1. Submit Request
      const created = await budgetService.createBudgetChangeRequest(
        projectId,
        {
          reason: "Foundation scope expansion due to rocky soil",
          categoryChanges: [
            { category: "MATERIAL", proposedPlanned: 260000 },
            { category: "WORKFORCE", proposedPlanned: 140000 },
          ],
        },
        actorId
      );

      expect(created.requestedChange).toBe(100000);
      expect(created.proposedBudget).toBe(500000);

      // 2. Admin Approves Request
      vi.spyOn(BudgetChangeRequest, "findOne").mockResolvedValue(mockChangeRequest as any);

      const approved = await budgetService.reviewBudgetChangeRequest(
        projectId,
        requestId,
        "APPROVED",
        "Approved after reviewing geotechnical report",
        actorId
      );

      expect(approved.status).toBe("APPROVED");
      expect(mockBudget.version).toBe(2);
      expect(mockBudget.totalPlanned).toBe(500000); // 260k + 140k + 70k + 30k
      expect(mockBudget.variance).toBe(400000); // 500k - 100k
    });
  });
});
