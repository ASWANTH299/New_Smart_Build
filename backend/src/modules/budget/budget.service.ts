import mongoose from "mongoose";
import { Budget, IBudget, BudgetCategoryType, BudgetStatus } from "./budget.model.js";
import { Expense, IExpense, ExpenseStatus } from "./expense.model.js";
import {
  BudgetChangeRequest,
  IBudgetChangeRequest,
  BudgetChangeRequestStatus,
} from "./budgetChangeRequest.model.js";
import { ProjectModel } from "../projects/project.model.js";
import { logAuditAction } from "../audit/auditLog.model.js";
import { AppError } from "../../utils/AppError.js";

export interface UpdateBudgetCategoryInput {
  category: BudgetCategoryType;
  plannedAmount: number;
  notes?: string;
}

export interface RecordExpenseInput {
  category: BudgetCategoryType;
  phaseId?: string | null;
  taskId?: string | null;
  description: string;
  amount: number;
  date?: string | Date;
  vendorId?: string | null;
  reference?: string;
  status?: ExpenseStatus;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  category?: BudgetCategoryType;
  phaseId?: string | null;
  taskId?: string | null;
  description?: string;
  amount?: number;
  date?: string | Date;
  vendorId?: string | null;
  reference?: string;
  status?: ExpenseStatus;
  receiptUrl?: string;
  notes?: string;
}

export interface CreateBudgetChangeRequestInput {
  reason: string;
  categoryChanges: Array<{
    category: BudgetCategoryType;
    proposedPlanned: number;
  }>;
}

export class BudgetService {
  /**
   * Helper: calculate variance and total rollups on a budget document
   */
  private recalculateBudget(budget: IBudget): void {
    let totalPlanned = 0;
    let totalActual = 0;
    let totalCommitted = 0;

    for (const cat of budget.categories) {
      cat.variance = Number((cat.plannedAmount - cat.actualAmount).toFixed(2));
      totalPlanned += cat.plannedAmount;
      totalActual += cat.actualAmount;
      totalCommitted += cat.committedAmount || 0;
    }

    budget.totalPlanned = Number(totalPlanned.toFixed(2));
    budget.totalActual = Number(totalActual.toFixed(2));
    budget.totalCommitted = Number(totalCommitted.toFixed(2));
    budget.variance = Number((totalPlanned - totalActual).toFixed(2));
  }

  /**
   * Get or initialize the Project Budget
   */
  async getOrCreateProjectBudget(projectId: string, actorId?: string): Promise<IBudget> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    let budget = await Budget.findOne({ projectId: new mongoose.Types.ObjectId(projectId) });

    if (!budget) {
      const defaultCategories: BudgetCategoryType[] = [
        "MATERIAL",
        "WORKFORCE",
        "EQUIPMENT",
        "OTHER",
      ];

      budget = new Budget({
        projectId: new mongoose.Types.ObjectId(projectId),
        version: 1,
        status: "APPROVED",
        totalPlanned: 0,
        totalActual: 0,
        totalCommitted: 0,
        variance: 0,
        currency: "INR",
        categories: defaultCategories.map((cat) => ({
          category: cat,
          plannedAmount: 0,
          actualAmount: 0,
          committedAmount: 0,
          variance: 0,
        })),
        createdBy: actorId ? new mongoose.Types.ObjectId(actorId) : project.projectManagerId,
      });

      await budget.save();

      await logAuditAction({
        actorUserId: actorId || project.projectManagerId,
        action: "INITIALIZE_BUDGET",
        entityType: "BUDGET",
        entityId: budget._id.toString(),
        projectId,
        result: "SUCCESS",
      });
    }

    return budget;
  }

  /**
   * Update planned amounts for budget categories
   */
  async updateBudgetPlan(
    projectId: string,
    categories: UpdateBudgetCategoryInput[],
    notes?: string,
    actorId?: string
  ): Promise<IBudget> {
    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    // Map and update each category
    const categoryMap = new Map<BudgetCategoryType, UpdateBudgetCategoryInput>();
    for (const c of categories) {
      categoryMap.set(c.category, c);
    }

    for (const cat of budget.categories) {
      if (categoryMap.has(cat.category)) {
        const input = categoryMap.get(cat.category)!;
        cat.plannedAmount = Math.max(0, input.plannedAmount);
        if (input.notes !== undefined) {
          cat.notes = input.notes;
        }
      }
    }

    if (notes !== undefined) {
      budget.notes = notes;
    }

    this.recalculateBudget(budget);
    await budget.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "UPDATE_BUDGET_PLAN",
      entityType: "BUDGET",
      entityId: budget._id.toString(),
      projectId,
      metadata: { totalPlanned: budget.totalPlanned, version: budget.version },
      result: "SUCCESS",
    });

    return budget;
  }

  /**
   * Get detailed budget financial summary with KPIs, category breakdown, and variance metrics
   */
  async getBudgetSummary(projectId: string, actorId?: string): Promise<{
    budget: IBudget;
    metrics: {
      totalPlanned: number;
      totalActual: number;
      totalCommitted: number;
      remainingBudget: number;
      variance: number;
      variancePercentage: number;
      burnRatePercentage: number;
      isOverBudget: boolean;
      status: BudgetStatus;
    };
    categoryBreakdown: Array<{
      category: BudgetCategoryType;
      plannedAmount: number;
      actualAmount: number;
      committedAmount: number;
      remainingAmount: number;
      variance: number;
      utilizationPercentage: number;
      isOverBudget: boolean;
      notes?: string;
    }>;
    recentExpenses: IExpense[];
    pendingChangeRequestsCount: number;
  }> {
    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    const [recentExpenses, pendingChangeRequestsCount] = await Promise.all([
      Expense.find({ projectId: new mongoose.Types.ObjectId(projectId) })
        .populate("vendorId", "name code")
        .populate("recordedBy", "firstName lastName email")
        .sort({ date: -1, createdAt: -1 })
        .limit(5),
      BudgetChangeRequest.countDocuments({
        projectId: new mongoose.Types.ObjectId(projectId),
        status: "PENDING",
      }),
    ]);

    const remainingBudget = Number((budget.totalPlanned - budget.totalActual).toFixed(2));
    const variancePercentage =
      budget.totalPlanned > 0
        ? Number((((budget.totalActual - budget.totalPlanned) / budget.totalPlanned) * 100).toFixed(2))
        : 0;
    const burnRatePercentage =
      budget.totalPlanned > 0
        ? Number(((budget.totalActual / budget.totalPlanned) * 100).toFixed(2))
        : 0;

    const categoryBreakdown = budget.categories.map((cat) => {
      const remaining = Number((cat.plannedAmount - cat.actualAmount).toFixed(2));
      const util =
        cat.plannedAmount > 0
          ? Number(((cat.actualAmount / cat.plannedAmount) * 100).toFixed(2))
          : cat.actualAmount > 0
          ? 100
          : 0;

      return {
        category: cat.category,
        plannedAmount: cat.plannedAmount,
        actualAmount: cat.actualAmount,
        committedAmount: cat.committedAmount || 0,
        remainingAmount: remaining,
        variance: cat.variance,
        utilizationPercentage: util,
        isOverBudget: cat.actualAmount > cat.plannedAmount,
        notes: cat.notes,
      };
    });

    return {
      budget,
      metrics: {
        totalPlanned: budget.totalPlanned,
        totalActual: budget.totalActual,
        totalCommitted: budget.totalCommitted,
        remainingBudget,
        variance: budget.variance,
        variancePercentage,
        burnRatePercentage,
        isOverBudget: budget.totalActual > budget.totalPlanned,
        status: budget.status,
      },
      categoryBreakdown,
      recentExpenses,
      pendingChangeRequestsCount,
    };
  }

  /**
   * Record a new expense and auto-rollup into project budget
   */
  async recordExpense(
    projectId: string,
    data: RecordExpenseInput,
    actorId: string
  ): Promise<IExpense> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    const expense = new Expense({
      projectId: new mongoose.Types.ObjectId(projectId),
      category: data.category,
      phaseId: data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null,
      taskId: data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null,
      description: data.description.trim(),
      amount: Number(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
      vendorId: data.vendorId ? new mongoose.Types.ObjectId(data.vendorId) : null,
      reference: data.reference?.trim(),
      status: data.status || "APPROVED",
      receiptUrl: data.receiptUrl?.trim(),
      notes: data.notes?.trim(),
      recordedBy: new mongoose.Types.ObjectId(actorId),
      approvedBy: data.status === "APPROVED" || data.status === "PAID" ? new mongoose.Types.ObjectId(actorId) : null,
      approvedAt: data.status === "APPROVED" || data.status === "PAID" ? new Date() : null,
    });

    await expense.save();

    // Rollup into budget if APPROVED or PAID
    if (expense.status === "APPROVED" || expense.status === "PAID") {
      const cat = budget.categories.find((c) => c.category === expense.category);
      if (cat) {
        cat.actualAmount = Number((cat.actualAmount + expense.amount).toFixed(2));
      }
      this.recalculateBudget(budget);
      await budget.save();
    }

    await logAuditAction({
      actorUserId: actorId,
      action: "RECORD_EXPENSE",
      entityType: "EXPENSE",
      entityId: expense._id.toString(),
      projectId,
      metadata: {
        category: expense.category,
        amount: expense.amount,
        status: expense.status,
      },
      result: "SUCCESS",
    });

    return await expense.populate([
      { path: "vendorId", select: "name code contact" },
      { path: "recordedBy", select: "firstName lastName email" },
      { path: "approvedBy", select: "firstName lastName email" },
      { path: "phaseId", select: "name" },
      { path: "taskId", select: "title" },
    ]);
  }

  /**
   * Get paginated expenses list with filtering
   */
  async getExpenses(
    projectId: string,
    filters: {
      category?: BudgetCategoryType;
      status?: ExpenseStatus;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    expenses: IExpense[];
    total: number;
    page: number;
    totalPages: number;
    totalAmount: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IExpense> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }
    if (filters.search) {
      query.$or = [
        { description: { $regex: filters.search, $options: "i" } },
        { reference: { $regex: filters.search, $options: "i" } },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [expenses, total, sumResult] = await Promise.all([
      Expense.find(query)
        .populate("vendorId", "name code")
        .populate("recordedBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("phaseId", "name")
        .populate("taskId", "title")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalAmount = sumResult.length > 0 ? Number(sumResult[0].total.toFixed(2)) : 0;

    return {
      expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      totalAmount,
    };
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(projectId: string, expenseId: string): Promise<IExpense> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new AppError("Invalid expense ID", 400);
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      projectId: new mongoose.Types.ObjectId(projectId),
    }).populate([
      { path: "vendorId", select: "name code contact" },
      { path: "recordedBy", select: "firstName lastName email" },
      { path: "approvedBy", select: "firstName lastName email" },
      { path: "phaseId", select: "name" },
      { path: "taskId", select: "title" },
    ]);

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    return expense;
  }

  /**
   * Update expense and reconcile budget rollup
   */
  async updateExpense(
    projectId: string,
    expenseId: string,
    data: UpdateExpenseInput,
    actorId: string
  ): Promise<IExpense> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new AppError("Invalid expense ID", 400);
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    const oldCategory = expense.category;
    const oldAmount = expense.amount;
    const oldStatus = expense.status;

    // Apply updates
    if (data.category !== undefined) expense.category = data.category;
    if (data.phaseId !== undefined) {
      expense.phaseId = data.phaseId ? new mongoose.Types.ObjectId(data.phaseId) : null;
    }
    if (data.taskId !== undefined) {
      expense.taskId = data.taskId ? new mongoose.Types.ObjectId(data.taskId) : null;
    }
    if (data.description !== undefined) expense.description = data.description.trim();
    if (data.amount !== undefined) expense.amount = Number(data.amount);
    if (data.date !== undefined) expense.date = new Date(data.date);
    if (data.vendorId !== undefined) {
      expense.vendorId = data.vendorId ? new mongoose.Types.ObjectId(data.vendorId) : null;
    }
    if (data.reference !== undefined) expense.reference = data.reference?.trim();
    if (data.status !== undefined) expense.status = data.status;
    if (data.receiptUrl !== undefined) expense.receiptUrl = data.receiptUrl?.trim();
    if (data.notes !== undefined) expense.notes = data.notes?.trim();

    await expense.save();

    // Reconcile budget actuals
    const wasCounted = oldStatus === "APPROVED" || oldStatus === "PAID";
    const isNowCounted = expense.status === "APPROVED" || expense.status === "PAID";

    if (wasCounted) {
      const oldCat = budget.categories.find((c) => c.category === oldCategory);
      if (oldCat) {
        oldCat.actualAmount = Math.max(0, Number((oldCat.actualAmount - oldAmount).toFixed(2)));
      }
    }

    if (isNowCounted) {
      const newCat = budget.categories.find((c) => c.category === expense.category);
      if (newCat) {
        newCat.actualAmount = Number((newCat.actualAmount + expense.amount).toFixed(2));
      }
    }

    this.recalculateBudget(budget);
    await budget.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "UPDATE_EXPENSE",
      entityType: "EXPENSE",
      entityId: expense._id.toString(),
      projectId,
      result: "SUCCESS",
    });

    return await expense.populate([
      { path: "vendorId", select: "name code contact" },
      { path: "recordedBy", select: "firstName lastName email" },
      { path: "approvedBy", select: "firstName lastName email" },
      { path: "phaseId", select: "name" },
      { path: "taskId", select: "title" },
    ]);
  }

  /**
   * Delete expense and adjust budget actual amounts
   */
  async deleteExpense(projectId: string, expenseId: string, actorId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new AppError("Invalid expense ID", 400);
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    // Rollback budget actual if previously counted
    if (expense.status === "APPROVED" || expense.status === "PAID") {
      const cat = budget.categories.find((c) => c.category === expense.category);
      if (cat) {
        cat.actualAmount = Math.max(0, Number((cat.actualAmount - expense.amount).toFixed(2)));
      }
      this.recalculateBudget(budget);
      await budget.save();
    }

    await Expense.findByIdAndDelete(expenseId);

    await logAuditAction({
      actorUserId: actorId,
      action: "DELETE_EXPENSE",
      entityType: "EXPENSE",
      entityId: expenseId,
      projectId,
      metadata: {
        category: expense.category,
        amount: expense.amount,
      },
      result: "SUCCESS",
    });
  }

  /**
   * Create a Budget Change Request
   */
  async createBudgetChangeRequest(
    projectId: string,
    data: CreateBudgetChangeRequestInput,
    actorId: string
  ): Promise<IBudgetChangeRequest> {
    const budget = await this.getOrCreateProjectBudget(projectId, actorId);

    const categoryMap = new Map<BudgetCategoryType, number>();
    for (const c of budget.categories) {
      categoryMap.set(c.category, c.plannedAmount);
    }

    let totalProposed = 0;
    const categoryChanges = data.categoryChanges.map((change) => {
      const current = categoryMap.get(change.category) || 0;
      const proposed = Math.max(0, Number(change.proposedPlanned));
      const diff = Number((proposed - current).toFixed(2));
      return {
        category: change.category,
        currentPlanned: current,
        proposedPlanned: proposed,
        changeAmount: diff,
      };
    });

    // Compute proposed total budget
    for (const c of budget.categories) {
      const change = categoryChanges.find((ch) => ch.category === c.category);
      if (change) {
        totalProposed += change.proposedPlanned;
      } else {
        totalProposed += c.plannedAmount;
      }
    }

    const requestedChange = Number((totalProposed - budget.totalPlanned).toFixed(2));

    const changeRequest = new BudgetChangeRequest({
      projectId: new mongoose.Types.ObjectId(projectId),
      budgetId: budget._id,
      requestedBy: new mongoose.Types.ObjectId(actorId),
      reason: data.reason.trim(),
      currentBudget: budget.totalPlanned,
      requestedChange,
      proposedBudget: Number(totalProposed.toFixed(2)),
      categoryChanges,
      status: "PENDING",
    });

    await changeRequest.save();

    await logAuditAction({
      actorUserId: actorId,
      action: "CREATE_BUDGET_CHANGE_REQUEST",
      entityType: "BUDGET_CHANGE_REQUEST",
      entityId: changeRequest._id.toString(),
      projectId,
      metadata: {
        requestedChange,
        proposedBudget: totalProposed,
      },
      result: "SUCCESS",
    });

    return await changeRequest.populate([
      { path: "requestedBy", select: "firstName lastName email" },
    ]);
  }

  /**
   * Get all Budget Change Requests for a project
   */
  async getBudgetChangeRequests(
    projectId: string,
    status?: BudgetChangeRequestStatus
  ): Promise<IBudgetChangeRequest[]> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const query: mongoose.FilterQuery<IBudgetChangeRequest> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };

    if (status) {
      query.status = status;
    }

    return await BudgetChangeRequest.find(query)
      .populate("requestedBy", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  /**
   * Review (Approve or Reject) a Budget Change Request
   */
  async reviewBudgetChangeRequest(
    projectId: string,
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    reviewNotes?: string,
    reviewerId?: string
  ): Promise<IBudgetChangeRequest> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError("Invalid request ID", 400);
    }

    const changeRequest = await BudgetChangeRequest.findOne({
      _id: requestId,
      projectId: new mongoose.Types.ObjectId(projectId),
    });

    if (!changeRequest) {
      throw new AppError("Budget change request not found", 404);
    }

    if (changeRequest.status !== "PENDING") {
      throw new AppError(
        `Budget change request is already ${changeRequest.status} and cannot be modified`,
        400
      );
    }

    changeRequest.status = decision;
    changeRequest.reviewedBy = reviewerId ? new mongoose.Types.ObjectId(reviewerId) : null;
    changeRequest.reviewedAt = new Date();
    changeRequest.reviewNotes = reviewNotes?.trim();

    await changeRequest.save();

    // If APPROVED, apply changes to Budget document and bump version
    if (decision === "APPROVED") {
      const budget = await Budget.findById(changeRequest.budgetId);
      if (budget) {
        budget.version += 1;
        budget.status = "REVISED";

        const changeMap = new Map<BudgetCategoryType, number>();
        for (const ch of changeRequest.categoryChanges) {
          changeMap.set(ch.category, ch.proposedPlanned);
        }

        for (const cat of budget.categories) {
          if (changeMap.has(cat.category)) {
            cat.plannedAmount = changeMap.get(cat.category)!;
          }
        }

        this.recalculateBudget(budget);
        await budget.save();
      }
    }

    await logAuditAction({
      actorUserId: reviewerId,
      action: decision === "APPROVED" ? "APPROVE_BUDGET_CHANGE" : "REJECT_BUDGET_CHANGE",
      entityType: "BUDGET_CHANGE_REQUEST",
      entityId: changeRequest._id.toString(),
      projectId,
      metadata: {
        decision,
        reviewNotes,
      },
      result: "SUCCESS",
    });

    return await changeRequest.populate([
      { path: "requestedBy", select: "firstName lastName email" },
      { path: "reviewedBy", select: "firstName lastName email" },
    ]);
  }
}

export const budgetService = new BudgetService();
export default budgetService;
