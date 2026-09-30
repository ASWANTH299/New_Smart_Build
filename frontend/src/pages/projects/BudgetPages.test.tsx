import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectBudgetPage } from "./ProjectBudgetPage.js";
import { ExpensesPage } from "./ExpensesPage.js";
import { BudgetChangeRequestsPage } from "./BudgetChangeRequestsPage.js";
import { budgetService } from "../../services/budgetService.js";
import { BudgetSummaryResponse, Expense, BudgetChangeRequest } from "../../types/budget.js";

vi.mock("../../services/budgetService.js");
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", primaryRole: "ADMIN" },
  }),
}));
vi.mock("../../hooks/useToast.js", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("Budget & Expense Pages Integration Tests (Phase 12)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders ProjectBudgetPage with KPI metrics and category breakdown", async () => {
    const mockSummary: BudgetSummaryResponse = {
      budget: {
        _id: "b1",
        projectId: "p1",
        version: 1,
        status: "APPROVED",
        totalPlanned: 500000,
        totalActual: 150000,
        totalCommitted: 0,
        variance: 350000,
        currency: "INR",
        categories: [
          { category: "MATERIAL", plannedAmount: 250000, actualAmount: 80000, variance: 170000 },
          { category: "WORKFORCE", plannedAmount: 150000, actualAmount: 50000, variance: 100000 },
          { category: "EQUIPMENT", plannedAmount: 70000, actualAmount: 20000, variance: 50000 },
          { category: "OTHER", plannedAmount: 30000, actualAmount: 0, variance: 30000 },
        ],
        createdBy: "u1",
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
      metrics: {
        totalPlanned: 500000,
        totalActual: 150000,
        totalCommitted: 0,
        remainingBudget: 350000,
        variance: 350000,
        variancePercentage: -70,
        burnRatePercentage: 30,
        isOverBudget: false,
        status: "APPROVED",
      },
      categoryBreakdown: [
        {
          category: "MATERIAL",
          plannedAmount: 250000,
          actualAmount: 80000,
          committedAmount: 0,
          remainingAmount: 170000,
          variance: 170000,
          utilizationPercentage: 32,
          isOverBudget: false,
        },
        {
          category: "WORKFORCE",
          plannedAmount: 150000,
          actualAmount: 50000,
          committedAmount: 0,
          remainingAmount: 100000,
          variance: 100000,
          utilizationPercentage: 33.33,
          isOverBudget: false,
        },
        {
          category: "EQUIPMENT",
          plannedAmount: 70000,
          actualAmount: 20000,
          committedAmount: 0,
          remainingAmount: 50000,
          variance: 50000,
          utilizationPercentage: 28.57,
          isOverBudget: false,
        },
        {
          category: "OTHER",
          plannedAmount: 30000,
          actualAmount: 0,
          committedAmount: 0,
          remainingAmount: 30000,
          variance: 30000,
          utilizationPercentage: 0,
          isOverBudget: false,
        },
      ],
      recentExpenses: [],
      pendingChangeRequestsCount: 0,
    };

    vi.spyOn(budgetService, "getBudgetSummary").mockResolvedValue({
      success: true,
      data: mockSummary,
    });

    render(
      <MemoryRouter initialEntries={["/projects/p1/budget"]}>
        <Routes>
          <Route path="/projects/:projectId/budget" element={<ProjectBudgetPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Budget & Financial Management")).toBeInTheDocument();
    expect((await screen.findAllByText("Total Budget"))[0]).toBeInTheDocument();
    expect((await screen.findAllByText("Actual Spend"))[0]).toBeInTheDocument();
    expect((await screen.findAllByText("Balance Remaining"))[0]).toBeInTheDocument();
    expect((await screen.findAllByText("MATERIAL"))[0]).toBeInTheDocument();
    expect((await screen.findAllByText("WORKFORCE"))[0]).toBeInTheDocument();
    expect((await screen.findAllByText("EQUIPMENT"))[0]).toBeInTheDocument();
  });

  it("renders ExpensesPage with logged expense records", async () => {
    const mockExpense: Expense = {
      _id: "exp1",
      projectId: "p1",
      category: "MATERIAL",
      description: "Ready-mix Concrete 20 cubic meters",
      amount: 45000,
      date: "2026-09-15T00:00:00Z",
      status: "APPROVED",
      reference: "INV-5501",
      vendorId: { _id: "v1", name: "UltraTech Concrete", code: "VEN-002" },
      recordedBy: { _id: "u1", firstName: "Site", lastName: "Engineer", email: "eng@sb.com" },
      createdAt: "2026-09-15T00:00:00Z",
      updatedAt: "2026-09-15T00:00:00Z",
    };

    vi.spyOn(budgetService, "getExpenses").mockResolvedValue({
      success: true,
      data: [mockExpense],
      pagination: {
        total: 1,
        page: 1,
        totalPages: 1,
        totalAmount: 45000,
      },
    });

    render(
      <MemoryRouter initialEntries={["/projects/p1/expenses"]}>
        <Routes>
          <Route path="/projects/:projectId/expenses" element={<ExpensesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Project Expenses Ledger")).toBeInTheDocument();
    expect(await screen.findByText("Ready-mix Concrete 20 cubic meters")).toBeInTheDocument();
    expect(await screen.findByText("UltraTech Concrete")).toBeInTheDocument();
  });

  it("renders BudgetChangeRequestsPage with revision requests", async () => {
    const mockChangeRequest: BudgetChangeRequest = {
      _id: "bcr123456",
      projectId: "p1",
      budgetId: "b1",
      requestedBy: { _id: "u1", firstName: "Project", lastName: "Manager", email: "pm@sb.com" },
      reason: "Expansion of structural steel due to architectural modification",
      currentBudget: 500000,
      requestedChange: 80000,
      proposedBudget: 580000,
      categoryChanges: [
        {
          category: "MATERIAL",
          currentPlanned: 250000,
          proposedPlanned: 330000,
          changeAmount: 80000,
        },
      ],
      status: "PENDING",
      createdAt: "2026-09-18T00:00:00Z",
      updatedAt: "2026-09-18T00:00:00Z",
    };

    vi.spyOn(budgetService, "getBudgetChangeRequests").mockResolvedValue({
      success: true,
      data: [mockChangeRequest],
    });

    vi.spyOn(budgetService, "getBudgetSummary").mockResolvedValue({
      success: true,
      data: {
        budget: {
          _id: "b1",
          projectId: "p1",
          version: 1,
          status: "APPROVED",
          totalPlanned: 500000,
          totalActual: 0,
          totalCommitted: 0,
          variance: 500000,
          currency: "INR",
          categories: [
            { category: "MATERIAL", plannedAmount: 250000, actualAmount: 0, variance: 250000 },
          ],
          createdBy: "u1",
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z",
        },
        metrics: {} as any,
        categoryBreakdown: [],
        recentExpenses: [],
        pendingChangeRequestsCount: 1,
      },
    });

    render(
      <MemoryRouter initialEntries={["/projects/p1/budget-change-requests"]}>
        <Routes>
          <Route
            path="/projects/:projectId/budget-change-requests"
            element={<BudgetChangeRequestsPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Budget Change Requests & Governance")).toBeInTheDocument();
    expect(
      await screen.findByText("Expansion of structural steel due to architectural modification")
    ).toBeInTheDocument();
  });
});
