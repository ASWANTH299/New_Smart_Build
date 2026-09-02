import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { materialService } from "../../services/materialService.js";
import { MaterialRequest, Material } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import Select from "../../components/ui/Select.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import SlideOverDrawer from "../../components/ui/SlideOverDrawer.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";

interface RequestItemForm {
  materialId: string;
  requestedQuantity: number;
  unit: string;
  notes: string;
}

export const MaterialRequestsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Request Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reason, setReason] = useState("");
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [items, setItems] = useState<RequestItemForm[]>([
    { materialId: "", requestedQuantity: 1, unit: "", notes: "" },
  ]);

  // Review Drawer (PM)
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const canRequest =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const isPMOrAdmin =
    user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";

  const fetchRequests = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [reqRes, matRes] = await Promise.all([
        materialService.getMaterialRequests(projectId, {
          status: statusFilter || undefined,
        }),
        materialService.getMaterials({ status: "ACTIVE" }),
      ]);

      if (reqRes.success && reqRes.data) {
        setRequests(reqRes.data);
      }
      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load material requests");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAddItemRow = () => {
    setItems([...items, { materialId: "", requestedQuantity: 1, unit: "", notes: "" }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof RequestItemForm, value: unknown) => {
    const updated = [...items];
    if (field === "materialId") {
      const mat = materials.find((m) => m._id === value);
      updated[index] = {
        ...updated[index],
        materialId: String(value),
        unit: mat ? mat.unit : updated[index].unit,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!reason.trim()) {
      showError("Validation Error", "Please provide a reason or purpose for the material request.");
      return;
    }

    const validItems = items.filter((i) => i.materialId && Number(i.requestedQuantity) > 0);
    if (validItems.length === 0) {
      showError("Validation Error", "Please select at least one material item with a valid quantity.");
      return;
    }

    try {
      setCreating(true);
      const res = await materialService.createMaterialRequest(projectId, {
        reason: reason.trim(),
        submitImmediately,
        items: validItems.map((i) => ({
          materialId: i.materialId,
          requestedQuantity: Number(i.requestedQuantity),
          unit: i.unit || "Units",
          notes: i.notes,
        })),
      });

      if (res.success && res.data) {
        showSuccess("Request Created", `Material Request ${res.data.requestNumber} created successfully!`);
        setIsCreateDrawerOpen(false);
        setReason("");
        setItems([{ materialId: "", requestedQuantity: 1, unit: "", notes: "" }]);
        fetchRequests();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to create material request");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReview = (req: MaterialRequest) => {
    setSelectedRequest(req);
    setReviewDecision("APPROVE");
    setRejectionReason("");
    setIsReviewDrawerOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedRequest) return;

    try {
      setReviewing(true);
      const res = await materialService.reviewMaterialRequest(
        projectId,
        selectedRequest._id,
        {
          decision: reviewDecision,
          rejectionReason: reviewDecision === "REJECT" ? rejectionReason : undefined,
        }
      );

      if (res.success) {
        showSuccess("Request Reviewed", `Request ${selectedRequest.requestNumber} ${reviewDecision.toLowerCase()}d.`);
        setIsReviewDrawerOpen(false);
        fetchRequests();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to review request");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link to={`/projects/${projectId}`} className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Project Workspace
            </Link>
            <span>/</span>
            <span>Material Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Material Requests & Requisitions
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Site engineer requisition workflow: Request → PM Approval → Store Manager Stock Issue.
          </p>
        </div>

        {canRequest && (
          <Button
            id="create-request-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + Create Material Request
          </Button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-2 font-display">
            Filter:
          </span>
          {[
            { value: "", label: "All Requests" },
            { value: "SUBMITTED", label: "Submitted" },
            { value: "APPROVED", label: "Approved" },
            { value: "PARTIALLY_ISSUED", label: "Partially Issued" },
            { value: "ISSUED", label: "Fully Issued" },
            { value: "DRAFT", label: "Drafts" },
            { value: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Requests Table */}
      {loading ? (
        <LoadingState message="Loading material requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Material Requests Found"
          description="No material requests match the selected status filter."
          action={
            canRequest ? (
              <Button variant="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                Create First Material Request
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                <tr>
                  <th className="py-3.5 px-4">Request #</th>
                  <th className="py-3.5 px-4">Reason / Scope</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                      <Link to={`/projects/${projectId}/material-requests/${req._id}`} className="hover:underline">
                        {req.requestNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                      {req.reason}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {req.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-300">
                      {typeof req.requestedBy === "object" && req.requestedBy
                        ? "name" in req.requestedBy
                          ? (req.requestedBy as any).name
                          : `${(req.requestedBy as any).firstName || ""} ${(req.requestedBy as any).lastName || ""}`.trim() || "User"
                        : "Site Engineer"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-sans">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status.toLowerCase()} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {isPMOrAdmin && req.status === "SUBMITTED" && (
                          <button
                            onClick={() => handleOpenReview(req)}
                            className="px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 hover:bg-brand-100 rounded-lg text-xs font-semibold"
                          >
                            Review
                          </button>
                        )}
                        <Link
                          to={`/projects/${projectId}/material-requests/${req._id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5"
                        >
                          Details <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Request SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Create Material Request"
        subtitle="Submit a material requisition from site for Project Manager approval"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <Input
            id="request-reason-input"
            label="Requisition Purpose / Reason *"
            placeholder="e.g. Concrete pour material requirement for Level 2 slab"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-display">
                Material Items ({items.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddItemRow}
              >
                Add Another Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/60 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-500 font-display">
                    <span>Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <Select
                    label="Select Material *"
                    value={item.materialId}
                    onChange={(e) => handleItemChange(idx, "materialId", e.target.value)}
                    options={[
                      { value: "", label: "-- Select Material from Master Catalog --" },
                      ...materials.map((m) => ({
                        value: m._id,
                        label: `${m.code} - ${m.name} (${m.unit})`,
                      })),
                    ]}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Quantity *"
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.requestedQuantity}
                      onChange={(e) => handleItemChange(idx, "requestedQuantity", Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                      placeholder="e.g. Bags, Tons, m³"
                    />
                  </div>

                  <Input
                    label="Item Notes / Placement Ref"
                    placeholder="e.g. Grid A-C column reinforcement"
                    value={item.notes}
                    onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={submitImmediately}
              onChange={(e) => setSubmitImmediately(e.target.checked)}
              className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Submit immediately for PM Review (uncheck to save as Draft)</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Create Request
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Review Request SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        title={selectedRequest ? `Review Request: ${selectedRequest.requestNumber}` : "Review Material Request"}
        subtitle="Approve or Reject the site engineer requisition"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-display">
              Review Decision *
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  value="APPROVE"
                  checked={reviewDecision === "APPROVE"}
                  onChange={() => setReviewDecision("APPROVE")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Approve Requisition
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  value="REJECT"
                  checked={reviewDecision === "REJECT"}
                  onChange={() => setReviewDecision("REJECT")}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <XCircle className="w-4 h-4" /> Reject Requisition
                </span>
              </label>
            </div>
          </div>

          {reviewDecision === "REJECT" && (
            <Input
              label="Rejection Reason *"
              placeholder="e.g. Quantity exceeds budgeted BOM allocation for current task"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsReviewDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewDecision === "APPROVE" ? "primary" : "danger"}
              type="submit"
              isLoading={reviewing}
            >
              Submit Decision
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default MaterialRequestsPage;
