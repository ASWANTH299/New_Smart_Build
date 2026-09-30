import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DollarSign,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  PieChart,
  FileText,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { budgetService } from "../../services/budgetService.js";
import { Expense, BudgetCategoryType, LogExpenseInput } from "../../types/budget.js";
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
import Pagination from "../../components/ui/Pagination.js";

export const ExpensesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalExpensesCount, setTotalExpensesCount] = useState<number>(0);
  const [totalDisbursedAmount, setTotalDisbursedAmount] = useState<number>(0);

  // Log Expense Drawer
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [expenseData, setExpenseData] = useState<LogExpenseInput>({
    category: "MATERIAL",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    reference: "",
    receiptUrl: "",
    notes: "",
  });

  const canManage = user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";
  const canLog =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchExpenses = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await budgetService.getExpenses(projectId, {
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });

      if (res.success && res.data) {
        setExpenses(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalExpensesCount(res.pagination.total);
          setTotalDisbursedAmount(res.pagination.totalAmount || 0);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project expenses");
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryFilter, searchQuery, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleLogExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (expenseData.amount <= 0) {
      showError("Validation Error", "Amount must be greater than zero.");
      return;
    }

    try {
      setLogging(true);
      const res = await budgetService.logExpense(projectId, expenseData);
      if (res.success) {
        showSuccess("Expense Logged", "Expense recorded and rolled up into budget.");
        setIsLogDrawerOpen(false);
        setExpenseData({
          category: "MATERIAL",
          description: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          reference: "",
          receiptUrl: "",
          notes: "",
        });
        fetchExpenses();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to log expense");
    } finally {
      setLogging(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure you want to delete this expense? The budget actuals will be reconciled automatically.")) {
      return;
    }

    try {
      const res = await budgetService.deleteExpense(projectId, expenseId);
      if (res.success) {
        showSuccess("Expense Deleted", "Expense removed and budget variance reconciled.");
        fetchExpenses();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link
              to={`/projects/${projectId}/budget`}
              className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Financial Summary
            </Link>
            <span>/</span>
            <span>Expenses Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Project Expenses Ledger
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Complete transaction record of disbursements, vendor vouchers, and site receipts.
          </p>
        </div>

        {canLog && (
          <Button
            id="log-new-expense-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsLogDrawerOpen(true)}
          >
            + Log Expense
          </Button>
        )}
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm">
        <Link
          to={`/projects/${projectId}/budget`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5"
        >
          <PieChart className="w-4 h-4" /> Financial Summary
        </Link>
        <Link
          to={`/projects/${projectId}/expenses`}
          className="font-bold text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 pb-2 -mb-2.5 flex items-center gap-1.5"
        >
          <DollarSign className="w-4 h-4" /> Expense Ledger
        </Link>
        <Link
          to={`/projects/${projectId}/budget-change-requests`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" /> Change Requests
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by description or reference..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Categories" },
                { value: "MATERIAL", label: "Material" },
                { value: "WORKFORCE", label: "Workforce" },
                { value: "EQUIPMENT", label: "Equipment" },
                { value: "OTHER", label: "Overhead / Other" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      {loading ? (
        <LoadingState message="Loading expenses ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchExpenses} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No Expenses Logged"
          description="No expense transactions matching current filter criteria."
          action={
            canLog ? (
              <Button variant="primary" onClick={() => setIsLogDrawerOpen(true)}>
                Log First Expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Payee / Vendor</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono">
                {expenses.map((exp) => {
                  const vendor = typeof exp.vendorId === "object" ? exp.vendorId : null;
                  const recorded = typeof exp.recordedBy === "object" ? exp.recordedBy : null;

                  return (
                    <tr key={exp._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-zinc-900 dark:text-zinc-100 font-medium">
                        <div>
                          <span>{exp.description}</span>
                          {exp.reference && (
                            <span className="block text-[10px] text-zinc-400 font-mono">
                              Ref: {exp.reference}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-400">
                        {vendor ? vendor.name : "Direct / Cash"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={exp.status.toLowerCase()} />
                      </td>

                      <td className="py-3.5 px-4 font-sans text-zinc-500">
                        {recorded ? recorded.firstName || recorded.name || recorded.email : "—"}
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Card>
      )}

      {/* Log Expense SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        title="Log Project Expense"
        subtitle="Record site disbursement and reconcile budget allocation"
        size="lg"
      >
        <form onSubmit={handleLogExpenseSubmit} className="space-y-4">
          <Select
            id="modal-expense-category"
            label="Cost Category *"
            value={expenseData.category}
            onChange={(e) =>
              setExpenseData({ ...expenseData, category: e.target.value as BudgetCategoryType })
            }
            options={[
              { value: "MATERIAL", label: "Material" },
              { value: "WORKFORCE", label: "Workforce" },
              { value: "EQUIPMENT", label: "Equipment & Machinery" },
              { value: "OTHER", label: "Overhead / Other" },
            ]}
            required
          />

          <Input
            id="modal-expense-amount"
            label="Amount (INR) *"
            type="number"
            min={1}
            step="any"
            value={expenseData.amount || ""}
            onChange={(e) =>
              setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g. 50000"
            required
          />

          <Input
            id="modal-expense-desc"
            label="Description *"
            placeholder="e.g. Sand & Aggregate batch delivery"
            value={expenseData.description}
            onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="modal-expense-date"
              label="Transaction Date *"
              type="date"
              value={expenseData.date}
              onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
              required
            />

            <Input
              id="modal-expense-ref"
              label="Reference / Invoice #"
              placeholder="e.g. BILL-9921"
              value={expenseData.reference || ""}
              onChange={(e) => setExpenseData({ ...expenseData, reference: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsLogDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={logging}>
              Record Expense
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default ExpensesPage;
