import api from "./api.js";
import {
  BudgetSummaryResponse,
  Budget,
  Expense,
  BudgetChangeRequest,
  LogExpenseInput,
  UpdateBudgetPlanInput,
  CreateBudgetChangeRequestInput,
  ReviewBudgetChangeRequestInput,
  BudgetCategoryType,
  ExpenseStatus,
} from "../types/budget.js";

export const budgetService = {
  /**
   * Get project budget summary and KPI metrics
   */
  async getBudgetSummary(projectId: string): Promise<{ success: boolean; data: BudgetSummaryResponse }> {
    const res = await api.get(`/projects/${projectId}/budget/summary`);
    return res.data;
  },

  /**
   * Direct budget allocation update (PM / Admin)
   */
  async updateBudgetPlan(
    projectId: string,
    payload: UpdateBudgetPlanInput
  ): Promise<{ success: boolean; data: Budget; message?: string }> {
    const res = await api.put(`/projects/${projectId}/budget`, payload);
    return res.data;
  },

  /**
   * Get paginated expenses for a project
   */
  async getExpenses(
    projectId: string,
    params?: {
      category?: BudgetCategoryType | string;
      status?: ExpenseStatus | string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    success: boolean;
    data: Expense[];
    pagination?: {
      total: number;
      page: number;
      totalPages: number;
      totalAmount: number;
    };
  }> {
    const res = await api.get(`/projects/${projectId}/expenses`, { params });
    return res.data;
  },

  /**
   * Get single expense details
   */
  async getExpenseById(
    projectId: string,
    expenseId: string
  ): Promise<{ success: boolean; data: Expense }> {
    const res = await api.get(`/projects/${projectId}/expenses/${expenseId}`);
    return res.data;
  },

  /**
   * Log an expense for a project
   */
  async logExpense(
    projectId: string,
    payload: LogExpenseInput
  ): Promise<{ success: boolean; data: Expense; message?: string }> {
    const res = await api.post(`/projects/${projectId}/expenses`, payload);
    return res.data;
  },

  /**
   * Update an expense
   */
  async updateExpense(
    projectId: string,
    expenseId: string,
    payload: Partial<LogExpenseInput>
  ): Promise<{ success: boolean; data: Expense; message?: string }> {
    const res = await api.put(`/projects/${projectId}/expenses/${expenseId}`, payload);
    return res.data;
  },

  /**
   * Delete an expense
   */
  async deleteExpense(
    projectId: string,
    expenseId: string
  ): Promise<{ success: boolean; message?: string }> {
    const res = await api.delete(`/projects/${projectId}/expenses/${expenseId}`);
    return res.data;
  },

  /**
   * Get budget change requests for a project
   */
  async getBudgetChangeRequests(
    projectId: string,
    params?: { status?: string }
  ): Promise<{ success: boolean; data: BudgetChangeRequest[] }> {
    const res = await api.get(`/projects/${projectId}/budget-change-requests`, { params });
    return res.data;
  },

  /**
   * Create a budget change request
   */
  async createBudgetChangeRequest(
    projectId: string,
    payload: CreateBudgetChangeRequestInput
  ): Promise<{ success: boolean; data: BudgetChangeRequest; message?: string }> {
    const res = await api.post(`/projects/${projectId}/budget-change-requests`, payload);
    return res.data;
  },

  /**
   * Review a budget change request (Approve / Reject)
   */
  async reviewBudgetChangeRequest(
    projectId: string,
    requestId: string,
    payload: ReviewBudgetChangeRequestInput
  ): Promise<{ success: boolean; data: BudgetChangeRequest; message?: string }> {
    const res = await api.put(
      `/projects/${projectId}/budget-change-requests/${requestId}/review`,
      payload
    );
    return res.data;
  },
};

export default budgetService;
