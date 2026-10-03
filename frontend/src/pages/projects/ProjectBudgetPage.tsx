import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  FileText,
  PieChart,
  ArrowLeft,
  Layers,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { budgetService } from "../../services/budgetService.js";
import {
  BudgetSummaryResponse,
  BudgetCategoryType,
  LogExpenseInput,
  UpdateBudgetPlanInput,
} from "../../types/budget.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import Select from "../../components/ui/Select.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import SlideOverDrawer from "../../components/ui/SlideOverDrawer.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const ProjectBudgetPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log Expense Drawer
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [loggingExpense, setLoggingExpense] = useState(false);
  const [expenseData, setExpenseData] = useState<LogExpenseInput>({
    category: "MATERIAL",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    reference: "",
    receiptUrl: "",
    notes: "",
  });

  // Edit Budget Baseline Drawer
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetPlanData, setBudgetPlanData] = useState<{
    material: number;
    workforce: number;
    equipment: number;
    other: number;
    notes: string;
  }>({
    material: 0,
    workforce: 0,
    equipment: 0,
    other: 0,
    notes: "",
  });

  const canManage = user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";
  const canLogExpense =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchBudgetSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await budgetService.getBudgetSummary(projectId);
      if (res.success && res.data) {
        setSummary(res.data);
        const cats = res.data.budget.categories;
        const mat = cats.find((c) => c.category === "MATERIAL")?.plannedAmount || 0;
        const wrk = cats.find((c) => c.category === "WORKFORCE")?.plannedAmount || 0;
        const eqp = cats.find((c) => c.category === "EQUIPMENT")?.plannedAmount || 0;
        const oth = cats.find((c) => c.category === "OTHER")?.plannedAmount || 0;
        setBudgetPlanData({
          material: mat,
          workforce: wrk,
          equipment: eqp,
          other: oth,
          notes: res.data.budget.notes || "",
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load budget summary");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBudgetSummary();
  }, [fetchBudgetSummary]);

  const handleLogExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (expenseData.amount <= 0) {
      showError("Validation Error", "Expense amount must be greater than zero.");
      return;
    }

    try {
      setLoggingExpense(true);
      const res = await budgetService.logExpense(projectId, expenseData);
      if (res.success) {
        showSuccess("Expense Logged", "Expense recorded and budget variances auto-updated.");
        setIsLogExpenseOpen(false);
        setExpenseData({
          category: "MATERIAL",
          description: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          reference: "",
          receiptUrl: "",
          notes: "",
        });
        fetchBudgetSummary();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to record expense");
    } finally {
      setLoggingExpense(false);
    }
  };

  const handleUpdateBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      setSavingBudget(true);
      const payload: UpdateBudgetPlanInput = {
        categories: [
          { category: "MATERIAL", plannedAmount: Number(budgetPlanData.material) || 0 },
          { category: "WORKFORCE", plannedAmount: Number(budgetPlanData.workforce) || 0 },
          { category: "EQUIPMENT", plannedAmount: Number(budgetPlanData.equipment) || 0 },
          { category: "OTHER", plannedAmount: Number(budgetPlanData.other) || 0 },
        ],
        notes: budgetPlanData.notes,
      };

      const res = await budgetService.updateBudgetPlan(projectId, payload);
      if (res.success) {
        showSuccess("Budget Plan Updated", "Category baseline allocations saved successfully.");
        setIsEditBudgetOpen(false);
        fetchBudgetSummary();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to update budget plan");
    } finally {
      setSavingBudget(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryColor = (cat: BudgetCategoryType) => {
    switch (cat) {
      case "MATERIAL":
        return "bg-blue-500 text-blue-500";
      case "WORKFORCE":
        return "bg-emerald-500 text-emerald-500";
      case "EQUIPMENT":
        return "bg-amber-500 text-amber-500";
      case "OTHER":
        return "bg-purple-500 text-purple-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link
              to={`/projects/${projectId}`}
              className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Project Workspace
            </Link>
            <span>/</span>
            <span>Budget & Financials</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Budget & Financial Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time planned allocations, cumulative expense rollups, variance analysis, and governance controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              id="edit-budget-baseline-btn"
              variant="outline"
              leftIcon={<Layers className="w-4 h-4" />}
              onClick={() => setIsEditBudgetOpen(true)}
            >
              Adjust Allocations
            </Button>
          )}

          {canLogExpense && (
            <Button
              id="log-expense-btn"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsLogExpenseOpen(true)}
            >
              + Log Expense
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm">
        <Link
          to={`/projects/${projectId}/budget`}
          className="font-bold text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 pb-2 -mb-2.5 flex items-center gap-1.5"
        >
          <PieChart className="w-4 h-4" /> Financial Summary
        </Link>
        <Link
          to={`/projects/${projectId}/expenses`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5"
        >
          <DollarSign className="w-4 h-4" /> Expense Ledger
        </Link>
        <Link
          to={`/projects/${projectId}/budget-change-requests`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" /> Change Requests
          {summary && summary.pendingChangeRequestsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
              {summary.pendingChangeRequestsCount}
            </span>
          )}
        </Link>
      </div>

      {loading ? (
        <LoadingState message="Calculating budget metrics and financial breakdown..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBudgetSummary} />
      ) : !summary ? (
        <EmptyState title="No Budget Data Available" description="Failed to initialize budget model." />
      ) : (
        <>
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget Planned */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Total Budget</span>
                <DollarSign className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
                {formatCurrency(summary.metrics.totalPlanned)}
              </div>
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <span>Version {summary.budget.version}</span>
                <span>•</span>
                <span className="capitalize">{summary.budget.status.toLowerCase()}</span>
              </div>
            </div>

            {/* Actual Spend */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Actual Spend</span>
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 font-display tabular-nums font-mono">
                {formatCurrency(summary.metrics.totalActual)}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                {summary.metrics.burnRatePercentage}% budget utilized
              </div>
            </div>

            {/* Balance Remaining */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Balance Remaining</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div
                className={`text-2xl font-extrabold mt-2 font-display tabular-nums font-mono ${
                  summary.metrics.remainingBudget >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(summary.metrics.remainingBudget)}
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">
                {summary.metrics.remainingBudget >= 0 ? "Under allocation" : "Budget deficit"}
              </div>
            </div>

            {/* Total Variance */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Variance (Net)</span>
                {summary.metrics.isOverBudget ? (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div
                className={`text-2xl font-extrabold mt-2 font-display tabular-nums font-mono ${
                  summary.metrics.isOverBudget
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(summary.metrics.variance)}
              </div>
              <div className="text-xs mt-1 flex items-center gap-1 font-medium">
                {summary.metrics.isOverBudget ? (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Over Budget ({summary.metrics.variancePercentage}%)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Within Baseline ({Math.abs(summary.metrics.variancePercentage)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Budget Breakdown by Category */}
          <Card className="p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Budget Allocation & Category Variance Breakdown
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Planned allocations vs cumulative logged expenses across the 4 major cost centers.
                </p>
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Currency: <span className="font-bold text-zinc-700 dark:text-zinc-300">{summary.budget.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-850/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(item.category).split(" ")[0]}`} />
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-xs font-mono">
                      {item.isOverBudget ? (
                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Over Budget
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.utilizationPercentage}% Used
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isOverBudget
                          ? "bg-red-500"
                          : item.utilizationPercentage > 85
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, item.utilizationPercentage)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 text-xs gap-2 pt-1 font-mono">
                    <div>
                      <span className="text-zinc-400 text-[10px] block uppercase">Planned</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(item.plannedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block uppercase">Actual Spend</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(item.actualAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block uppercase">Remaining</span>
                      <span
                        className={`font-semibold ${
                          item.remainingAmount < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {formatCurrency(item.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Expenses Ledger Snapshot */}
          <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 font-display text-base">
                  Recent Expense Logs
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Latest 5 transactions rolled up to project financial baseline.
                </p>
              </div>

              <Link
                to={`/projects/${projectId}/expenses`}
                className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
              >
                View Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {summary.recentExpenses.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No expenses logged for this project yet. Click "+ Log Expense" above to record material, workforce, or equipment payments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payee / Vendor</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono">
                    {summary.recentExpenses.map((exp) => {
                      const vendor = typeof exp.vendorId === "object" ? exp.vendorId : null;
                      return (
                        <tr key={exp._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 text-zinc-500">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-zinc-900 dark:text-zinc-100 font-medium">
                            {exp.description}
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-4 font-sans text-zinc-500">
                            {vendor ? vendor.name : exp.reference || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={exp.status.toLowerCase()} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Log Expense SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isLogExpenseOpen}
        onClose={() => setIsLogExpenseOpen(false)}
        title="Log Project Expense"
        subtitle="Record site or operational disbursement and auto-rollup into project budget"
        size="lg"
      >
        <form onSubmit={handleLogExpenseSubmit} className="space-y-4">
          <Select
            id="expense-category-select"
            label="Cost Category *"
            value={expenseData.category}
            onChange={(e) =>
              setExpenseData({ ...expenseData, category: e.target.value as BudgetCategoryType })
            }
            options={[
              { value: "MATERIAL", label: "Material (Raw, Concrete, Steel, etc.)" },
              { value: "WORKFORCE", label: "Workforce & Labor" },
              { value: "EQUIPMENT", label: "Plant & Machinery / Rentals" },
              { value: "OTHER", label: "Overhead / Site Logistics / Permits" },
            ]}
            required
          />

          <Input
            id="expense-amount-input"
            label="Expense Amount (INR) *"
            type="number"
            min={1}
            step="any"
            value={expenseData.amount || ""}
            onChange={(e) =>
              setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g. 25000"
            required
          />

          <Input
            id="expense-description-input"
            label="Expense Description / Purpose *"
            placeholder="e.g. 50 Bags Ready-mix Concrete pour for Basement Pillar"
            value={expenseData.description}
            onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="expense-date-input"
              label="Transaction Date *"
              type="date"
              value={expenseData.date}
              onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
              required
            />

            <Input
              id="expense-ref-input"
              label="Invoice / Voucher Reference"
              placeholder="e.g. INV-2026-0881"
              value={expenseData.reference || ""}
              onChange={(e) => setExpenseData({ ...expenseData, reference: e.target.value })}
            />
          </div>

          <Input
            id="expense-receipt-url"
            label="Receipt / Proof Document URL (Optional)"
            placeholder="https://storage.smartbuild.com/receipts/..."
            value={expenseData.receiptUrl || ""}
            onChange={(e) => setExpenseData({ ...expenseData, receiptUrl: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsLogExpenseOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={loggingExpense}>
              Record & Rollup
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Edit Budget Allocations SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        title="Adjust Budget Allocations"
        subtitle="Set planned capital ceilings per category"
        size="lg"
      >
        <form onSubmit={handleUpdateBudgetSubmit} className="space-y-4">
          <Input
            id="budget-plan-material"
            label="Material Allocation (INR) *"
            type="number"
            min={0}
            value={budgetPlanData.material}
            onChange={(e) =>
              setBudgetPlanData({ ...budgetPlanData, material: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <Input
            id="budget-plan-workforce"
            label="Workforce Allocation (INR) *"
            type="number"
            min={0}
            value={budgetPlanData.workforce}
            onChange={(e) =>
              setBudgetPlanData({ ...budgetPlanData, workforce: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <Input
            id="budget-plan-equipment"
            label="Equipment & Machinery Allocation (INR) *"
            type="number"
            min={0}
            value={budgetPlanData.equipment}
            onChange={(e) =>
              setBudgetPlanData({ ...budgetPlanData, equipment: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <Input
            id="budget-plan-other"
            label="Overhead & Site Logistics (INR) *"
            type="number"
            min={0}
            value={budgetPlanData.other}
            onChange={(e) =>
              setBudgetPlanData({ ...budgetPlanData, other: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-between">
            <span className="text-zinc-500 font-sans">Total Planned Budget:</span>
            <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(
                (Number(budgetPlanData.material) || 0) +
                  (Number(budgetPlanData.workforce) || 0) +
                  (Number(budgetPlanData.equipment) || 0) +
                  (Number(budgetPlanData.other) || 0)
              )}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsEditBudgetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingBudget}>
              Save Allocations
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default ProjectBudgetPage;
