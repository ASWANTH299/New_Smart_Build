import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Plus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { budgetService } from "../../services/budgetService.js";
import {
  BudgetChangeRequest,
  CreateBudgetChangeRequestInput,
  BudgetCategoryType,
  BudgetSummaryResponse,
} from "../../types/budget.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import Textarea from "../../components/ui/Textarea.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import SlideOverDrawer from "../../components/ui/SlideOverDrawer.js";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const BudgetChangeRequestsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requests, setRequests] = useState<BudgetChangeRequest[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Request Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestData, setRequestData] = useState<{
    reason: string;
    material: number;
    workforce: number;
    equipment: number;
    other: number;
  }>({
    reason: "",
    material: 0,
    workforce: 0,
    equipment: 0,
    other: 0,
  });

  // Review Modal (Admin only)
  const [selectedRequest, setSelectedRequest] = useState<BudgetChangeRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const isAdmin = user?.primaryRole === "ADMIN";
  const canRequest = user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [reqRes, sumRes] = await Promise.all([
        budgetService.getBudgetChangeRequests(projectId),
        budgetService.getBudgetSummary(projectId),
      ]);

      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
        const cats = sumRes.data.budget.categories;
        setRequestData((prev) => ({
          ...prev,
          material: cats.find((c) => c.category === "MATERIAL")?.plannedAmount || 0,
          workforce: cats.find((c) => c.category === "WORKFORCE")?.plannedAmount || 0,
          equipment: cats.find((c) => c.category === "EQUIPMENT")?.plannedAmount || 0,
          other: cats.find((c) => c.category === "OTHER")?.plannedAmount || 0,
        }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load budget change requests");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!requestData.reason.trim()) {
      showError("Validation Error", "Please provide a detailed justification for the budget revision.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateBudgetChangeRequestInput = {
        reason: requestData.reason,
        categoryChanges: [
          { category: "MATERIAL", proposedPlanned: Number(requestData.material) || 0 },
          { category: "WORKFORCE", proposedPlanned: Number(requestData.workforce) || 0 },
          { category: "EQUIPMENT", proposedPlanned: Number(requestData.equipment) || 0 },
          { category: "OTHER", proposedPlanned: Number(requestData.other) || 0 },
        ],
      };

      const res = await budgetService.createBudgetChangeRequest(projectId, payload);
      if (res.success) {
        showSuccess("Change Request Submitted", "Budget revision request submitted for Admin review.");
        setIsCreateDrawerOpen(false);
        setRequestData({
          reason: "",
          material: 0,
          workforce: 0,
          equipment: 0,
          other: 0,
        });
        fetchData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to submit change request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!projectId || !selectedRequest) return;

    try {
      setReviewing(true);
      const res = await budgetService.reviewBudgetChangeRequest(projectId, selectedRequest._id, {
        decision: reviewDecision,
        reviewNotes,
      });

      if (res.success) {
        showSuccess(
          `Request ${reviewDecision}`,
          `Budget change request was ${reviewDecision.toLowerCase()} successfully.`
        );
        setSelectedRequest(null);
        setReviewNotes("");
        fetchData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to review change request");
    } finally {
      setReviewing(false);
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
            <span>Budget Change Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Budget Change Requests & Governance
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Formal audit trail for baseline scope adjustments, variance revisions, and Admin authorizations.
          </p>
        </div>

        {canRequest && (
          <Button
            id="new-change-request-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + New Change Request
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
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5"
        >
          <DollarSign className="w-4 h-4" /> Expense Ledger
        </Link>
        <Link
          to={`/projects/${projectId}/budget-change-requests`}
          className="font-bold text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 pb-2 -mb-2.5 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" /> Change Requests
        </Link>
      </div>

      {/* Requests List */}
      {loading ? (
        <LoadingState message="Loading budget change requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Budget Change Requests"
          description="Baseline budget has not undergone any change request revisions yet."
          action={
            canRequest ? (
              <Button variant="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                Submit Change Request
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const requester = typeof req.requestedBy === "object" ? req.requestedBy : null;
            const reviewer = typeof req.reviewedBy === "object" ? req.reviewedBy : null;

            return (
              <Card
                key={req._id}
                className="p-5 border border-zinc-200/90 dark:border-zinc-800 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 font-display">
                        Revision Request #{req._id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={req.status.toLowerCase()} />
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                      <span>Submitted by: {requester?.firstName || requester?.name || requester?.email || "PM"}</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {isAdmin && req.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(req)}
                    >
                      Review & Authorize
                    </Button>
                  )}
                </div>

                <div className="text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold block text-zinc-500 text-[10px] uppercase font-sans mb-0.5">
                    Justification / Reason
                  </span>
                  <p className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800 font-sans">
                    {req.reason}
                  </p>
                </div>

                {/* Financial Shift Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-850/50 border border-zinc-200/70 dark:border-zinc-800 font-mono text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block font-sans">Current Budget</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(req.currentBudget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block font-sans">Net Adjustment</span>
                    <span
                      className={`font-bold ${
                        req.requestedChange > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : req.requestedChange < 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-600"
                      }`}
                    >
                      {req.requestedChange > 0 ? `+${formatCurrency(req.requestedChange)}` : formatCurrency(req.requestedChange)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block font-sans">Proposed New Baseline</span>
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(req.proposedBudget)}
                    </span>
                  </div>
                </div>

                {/* Category Changes Table */}
                {req.categoryChanges && req.categoryChanges.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                      <thead className="text-[10px] text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-2">Category</th>
                          <th className="py-2">Previous Allocation</th>
                          <th className="py-2">Proposed Allocation</th>
                          <th className="py-2 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {req.categoryChanges.map((c) => (
                          <tr key={c.category}>
                            <td className="py-2 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                              {c.category}
                            </td>
                            <td className="py-2 text-zinc-500">{formatCurrency(c.currentPlanned)}</td>
                            <td className="py-2 font-bold text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(c.proposedPlanned)}
                            </td>
                            <td
                              className={`py-2 text-right font-bold ${
                                c.changeAmount > 0
                                  ? "text-amber-600 dark:text-amber-400"
                                  : c.changeAmount < 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-zinc-400"
                              }`}
                            >
                              {c.changeAmount > 0 ? `+${formatCurrency(c.changeAmount)}` : formatCurrency(c.changeAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Review Details if reviewed */}
                {req.status !== "PENDING" && reviewer && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-sans flex items-center gap-2">
                    <span className="font-semibold">
                      Reviewed by {reviewer.firstName || reviewer.name || reviewer.email} on{" "}
                      {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : "—"}:
                    </span>
                    <span>{req.reviewNotes || "No review notes specified."}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Change Request SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Submit Budget Change Request"
        subtitle="Request category allocation changes requiring Admin approval"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Textarea
            id="change-request-reason"
            label="Justification / Business Reason *"
            placeholder="Explain the necessity for baseline adjustment (e.g. soil condition change, structural expansion, steel price escalation)..."
            value={requestData.reason}
            onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
            rows={4}
            required
          />

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-display">
              Proposed Category Allocations (INR)
            </h4>

            <Input
              id="prop-material"
              label="Material Allocation *"
              type="number"
              min={0}
              value={requestData.material}
              onChange={(e) =>
                setRequestData({ ...requestData, material: parseFloat(e.target.value) || 0 })
              }
              required
            />

            <Input
              id="prop-workforce"
              label="Workforce Allocation *"
              type="number"
              min={0}
              value={requestData.workforce}
              onChange={(e) =>
                setRequestData({ ...requestData, workforce: parseFloat(e.target.value) || 0 })
              }
              required
            />

            <Input
              id="prop-equipment"
              label="Equipment Allocation *"
              type="number"
              min={0}
              value={requestData.equipment}
              onChange={(e) =>
                setRequestData({ ...requestData, equipment: parseFloat(e.target.value) || 0 })
              }
              required
            />

            <Input
              id="prop-other"
              label="Overhead & Other Allocation *"
              type="number"
              min={0}
              value={requestData.other}
              onChange={(e) =>
                setRequestData({ ...requestData, other: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-between">
            <span className="text-zinc-500 font-sans">Proposed Total Budget:</span>
            <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(
                (Number(requestData.material) || 0) +
                  (Number(requestData.workforce) || 0) +
                  (Number(requestData.equipment) || 0) +
                  (Number(requestData.other) || 0)
              )}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Submit for Approval
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Review Modal (Admin) */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Authorize Budget Change Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Approving will update the project's planned baseline allocations, bump the budget version, and recalculate variances.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-sans">
              Decision *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  value="APPROVED"
                  checked={reviewDecision === "APPROVED"}
                  onChange={() => setReviewDecision("APPROVED")}
                />
                Approve & Revise Baseline
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  value="REJECTED"
                  checked={reviewDecision === "REJECTED"}
                  onChange={() => setReviewDecision("REJECTED")}
                />
                Reject Request
              </label>
            </div>
          </div>

          <Textarea
            id="review-notes-input"
            label="Review Notes / Reason"
            placeholder="e.g. Approved per structural geotechnical report..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewDecision === "APPROVED" ? "primary" : "outline"}
              onClick={handleReviewSubmit}
              isLoading={reviewing}
            >
              Confirm {reviewDecision}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetChangeRequestsPage;
