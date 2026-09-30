export type BudgetCategoryType = "MATERIAL" | "WORKFORCE" | "EQUIPMENT" | "OTHER";

export type BudgetStatus = "DRAFT" | "APPROVED" | "REVISED" | "LOCKED";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type BudgetChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BudgetCategory {
  category: BudgetCategoryType;
  plannedAmount: number;
  actualAmount: number;
  committedAmount?: number;
  variance: number;
  notes?: string;
}

export interface Budget {
  _id: string;
  projectId: string;
  version: number;
  status: BudgetStatus;
  totalPlanned: number;
  totalActual: number;
  totalCommitted: number;
  variance: number;
  categories: BudgetCategory[];
  currency: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  id?: string;
  projectId: string;
  category: BudgetCategoryType;
  phaseId?: { _id: string; name: string } | string | null;
  taskId?: { _id: string; title: string } | string | null;
  description: string;
  amount: number;
  date: string;
  vendorId?: { _id: string; name: string; code: string } | string | null;
  reference?: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  recordedBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  approvedBy?: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string | null;
  approvedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryChange {
  category: BudgetCategoryType;
  currentPlanned: number;
  proposedPlanned: number;
  changeAmount: number;
}

export interface BudgetChangeRequest {
  _id: string;
  id?: string;
  projectId: string;
  budgetId: string;
  requestedBy: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string;
  reason: string;
  currentBudget: number;
  requestedChange: number;
  proposedBudget: number;
  categoryChanges: CategoryChange[];
  status: BudgetChangeRequestStatus;
  reviewedBy?: { _id: string; firstName?: string; lastName?: string; name?: string; email: string } | string | null;
  reviewedAt?: string | null;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetMetrics {
  totalPlanned: number;
  totalActual: number;
  totalCommitted: number;
  remainingBudget: number;
  variance: number;
  variancePercentage: number;
  burnRatePercentage: number;
  isOverBudget: boolean;
  status: BudgetStatus;
}

export interface CategoryBreakdownItem {
  category: BudgetCategoryType;
  plannedAmount: number;
  actualAmount: number;
  committedAmount: number;
  remainingAmount: number;
  variance: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  notes?: string;
}

export interface BudgetSummaryResponse {
  budget: Budget;
  metrics: BudgetMetrics;
  categoryBreakdown: CategoryBreakdownItem[];
  recentExpenses: Expense[];
  pendingChangeRequestsCount: number;
}

export interface LogExpenseInput {
  category: BudgetCategoryType;
  description: string;
  amount: number;
  date?: string;
  vendorId?: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  reference?: string;
  status?: ExpenseStatus;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateBudgetPlanInput {
  categories: Array<{
    category: BudgetCategoryType;
    plannedAmount: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface CreateBudgetChangeRequestInput {
  reason: string;
  categoryChanges: Array<{
    category: BudgetCategoryType;
    proposedPlanned: number;
  }>;
}

export interface ReviewBudgetChangeRequestInput {
  decision: "APPROVED" | "REJECTED";
  reviewNotes?: string;
}
