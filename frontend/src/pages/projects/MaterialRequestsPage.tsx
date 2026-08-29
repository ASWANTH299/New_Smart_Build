import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import { MaterialRequest, Material } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal.js";
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

  // Create Request Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reason, setReason] = useState("");
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [items, setItems] = useState<RequestItemForm[]>([
    { materialId: "", requestedQuantity: 1, unit: "", notes: "" },
  ]);

  // Review Modal (PM)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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
        setIsCreateModalOpen(false);
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
    setIsReviewModalOpen(true);
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
        setIsReviewModalOpen(false);
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
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-sans">
            <Link to={`/projects/${projectId}`} className="hover:underline text-brand-600 dark:text-brand-400">
              ← Project Workspace
            </Link>
            <span>/</span>
            <span>Material Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Material Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Site engineer requisition workflow: Request → PM Approval → Store Manager Stock Issue.
          </p>
        </div>

        {canRequest && (
          <Button
            id="create-request-btn"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Material Request
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">
            Status:
          </span>
          {[
            { value: "", label: "All Requests" },
            { value: "SUBMITTED", label: "Submitted (Pending PM Review)" },
            { value: "APPROVED", label: "Approved (Ready to Issue)" },
            { value: "PARTIALLY_ISSUED", label: "Partially Issued" },
            { value: "ISSUED", label: "Fully Issued" },
            { value: "DRAFT", label: "Drafts" },
            { value: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
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
          description="Site engineers can submit material requests against project tasks or general construction activities."
          action={
            canRequest ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create First Request
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Request #</th>
                  <th className="py-3.5 px-4">Reason / Purpose</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {requests.map((req) => {
                  const requester =
                    typeof req.requestedBy === "object" && req.requestedBy !== null
                      ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                      : "Site Engineer";

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                        <Link to={`/projects/${projectId}/material-requests/${req._id}`} className="hover:underline">
                          {req.requestNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {requester}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-semibold">
                        {req.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status.toLowerCase()} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-sans">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans space-x-2">
                        {isPMOrAdmin && req.status === "SUBMITTED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenReview(req)}
                          >
                            Review
                          </Button>
                        )}
                        <Link
                          to={`/projects/${projectId}/material-requests/${req._id}`}
                          className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 ml-2"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Material Request"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            id="request-reason-input"
            label="Purpose / Work Description *"
            placeholder="e.g. Concrete footing pour for Grid 4 foundation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Requested Materials List
              </span>
              <Button variant="outline" size="sm" type="button" onClick={handleAddItemRow}>
                + Add Item Row
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <Select
                      id={`req-mat-${idx}`}
                      value={item.materialId}
                      onChange={(e) => handleItemChange(idx, "materialId", e.target.value)}
                      options={[
                        { value: "", label: "-- Select Material --" },
                        ...materials.map((m) => ({
                          value: m._id,
                          label: `${m.code} - ${m.name} (${m.unit})`,
                        })),
                      ]}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      id={`req-qty-${idx}`}
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Qty"
                      value={item.requestedQuantity}
                      onChange={(e) => handleItemChange(idx, "requestedQuantity", Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Input
                    id={`req-note-${idx}`}
                    placeholder="Item notes / specs (optional)"
                    value={item.notes}
                    onChange={(e) => handleItemChange(idx, "notes", e.target.value)}
                    className="text-xs"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="submit-immediately-chk"
              checked={submitImmediately}
              onChange={(e) => setSubmitImmediately(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="submit-immediately-chk" className="text-xs text-slate-700 dark:text-slate-300">
              Submit directly for PM review (otherwise saved as Draft)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Create Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Request Modal (PM) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review Material Request: ${selectedRequest?.requestNumber}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-700">
            <div><span className="font-semibold">Reason:</span> {selectedRequest?.reason}</div>
            <div><span className="font-semibold">Items Count:</span> {selectedRequest?.items?.length || 0} material line(s)</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Review Decision *
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-900 dark:text-white cursor-pointer">
                <input
                  type="radio"
                  name="review-decision"
                  value="APPROVE"
                  checked={reviewDecision === "APPROVE"}
                  onChange={() => setReviewDecision("APPROVE")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Approve Request</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-slate-900 dark:text-white cursor-pointer">
                <input
                  type="radio"
                  name="review-decision"
                  value="REJECT"
                  checked={reviewDecision === "REJECT"}
                  onChange={() => setReviewDecision("REJECT")}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="font-medium text-red-700 dark:text-red-400">Reject Request</span>
              </label>
            </div>
          </div>

          {reviewDecision === "REJECT" && (
            <Input
              id="rejection-reason-input"
              label="Rejection Reason *"
              placeholder="State reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewDecision === "APPROVE" ? "secondary" : "danger"}
              type="submit"
              isLoading={reviewing}
            >
              Submit Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialRequestsPage;
