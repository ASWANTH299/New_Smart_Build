import { Request, Response, NextFunction } from "express";
import { budgetService } from "./budget.service.js";

export class BudgetController {
  /**
   * Get project budget summary and financial metrics
   */
  async getBudgetSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const summary = await budgetService.getBudgetSummary(projectId, (req.user as any)?._id?.toString());
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update budget allocations (planned amounts)
   */
  async updateBudgetPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { categories, notes } = req.body;
      const budget = await budgetService.updateBudgetPlan(
        projectId,
        categories,
        notes,
        (req.user as any)?._id?.toString()
      );
      res.status(200).json({
        success: true,
        data: budget,
        message: "Budget plan updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record a new expense
   */
  async recordExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const expense = await budgetService.recordExpense(
        projectId,
        req.body,
        (req.user as any)?._id?.toString() || ""
      );
      res.status(201).json({
        success: true,
        data: expense,
        message: "Expense logged and rolled up to budget successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paginated expenses for a project
   */
  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { category, status, startDate, endDate, search, page, limit } = req.query;

      const result = await budgetService.getExpenses(projectId, {
        category: category as any,
        status: status as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.expenses,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          totalAmount: result.totalAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single expense details
   */
  async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const expenseId = String(req.params.expenseId);
      const expense = await budgetService.getExpenseById(projectId, expenseId);
      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const expenseId = String(req.params.expenseId);
      const expense = await budgetService.updateExpense(
        projectId,
        expenseId,
        req.body,
        (req.user as any)?._id?.toString() || ""
      );
      res.status(200).json({
        success: true,
        data: expense,
        message: "Expense updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const expenseId = String(req.params.expenseId);
      await budgetService.deleteExpense(projectId, expenseId, (req.user as any)?._id?.toString() || "");
      res.status(200).json({
        success: true,
        message: "Expense deleted and budget reconciled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a budget change request
   */
  async createBudgetChangeRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const changeRequest = await budgetService.createBudgetChangeRequest(
        projectId,
        req.body,
        (req.user as any)?._id?.toString() || ""
      );
      res.status(201).json({
        success: true,
        data: changeRequest,
        message: "Budget change request submitted for review",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List budget change requests
   */
  async getBudgetChangeRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { status } = req.query;
      const requests = await budgetService.getBudgetChangeRequests(projectId, status as any);
      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review a budget change request (Admin only)
   */
  async reviewBudgetChangeRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const requestId = String(req.params.requestId);
      const { decision, reviewNotes } = req.body;
      const result = await budgetService.reviewBudgetChangeRequest(
        projectId,
        requestId,
        decision,
        reviewNotes,
        (req.user as any)?._id?.toString() || ""
      );
      res.status(200).json({
        success: true,
        data: result,
        message: `Budget change request ${decision.toLowerCase()} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const budgetController = new BudgetController();
export default budgetController;
