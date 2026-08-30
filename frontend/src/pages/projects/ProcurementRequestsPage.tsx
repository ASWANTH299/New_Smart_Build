import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";
import { ProcurementRequest } from "../../types/procurement.js";
import { Material } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

interface PRItemForm {
  materialId: string;
  requestedQuantity: number;
  estimatedUnitPrice: number;
  unit: string;
  notes: string;
}

export const ProcurementRequestsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reason, setReason] = useState("");
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [items, setItems] = useState<PRItemForm[]>([
    { materialId: "", requestedQuantity: 1, estimatedUnitPrice: 0, unit: "", notes: "" },
  ]);

  // Review Modal (PM / Admin)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const canRequest =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const isPMOrAdmin =
    user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";

  const fetchRequests = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [reqRes, matRes] = await Promise.all([
        procurementService.getProcurementRequests(projectId, {
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
      setError(err instanceof Error ? err.message : "Failed to load procurement requests");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { materialId: "", requestedQuantity: 1, estimatedUnitPrice: 0, unit: "", notes: "" },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof PRItemForm, value: unknown) => {
    const updated = [...items];
    if (field === "materialId") {
      const mat = materials.find((m) => m._id === value);
      updated[index] = {
        ...updated[index],
        materialId: String(value),
        unit: mat ? mat.unit : updated[index].unit,
        estimatedUnitPrice: mat ? mat.unitPrice || 0 : updated[index].estimatedUnitPrice,
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
      showError("Validation Error", "Please provide a reason or shortage justification.");
      return;
    }

    const validItems = items.filter((i) => i.materialId && Number(i.requestedQuantity) > 0);
    if (validItems.length === 0) {
      showError("Validation Error", "Please specify at least one valid material line item.");
      return;
    }

    try {
      setCreating(true);
      const res = await procurementService.createProcurementRequest(projectId, {
        reason: reason.trim(),
        submitImmediately,
        items: validItems.map((i) => ({
          materialId: i.materialId,
          requestedQuantity: Number(i.requestedQuantity),
          estimatedUnitPrice: Number(i.estimatedUnitPrice) || 0,
          unit: i.unit || "Units",
          notes: i.notes,
        })),
      });

      if (res.success && res.data) {
        showSuccess("Request Created", `Procurement Request ${res.data.requestNumber} created successfully.`);
        setIsCreateModalOpen(false);
        setReason("");
        setItems([{ materialId: "", requestedQuantity: 1, estimatedUnitPrice: 0, unit: "", notes: "" }]);
        fetchRequests();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to create procurement request");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReview = (req: ProcurementRequest) => {
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
      const res = await procurementService.reviewProcurementRequest(
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
      showError("Error", err instanceof Error ? err.message : "Failed to review procurement request");
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
            <span>Procurement Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Procurement Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Material shortage requisitions: Shortage → Procurement Request → Review & Approval → Purchase Order.
          </p>
        </div>

        {canRequest && (
          <Button
            id="create-procurement-request-btn"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + New Procurement Request
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">
            Status:
          </span>
          {[
            { value: "", label: "All Requests" },
            { value: "SUBMITTED", label: "Submitted (Pending PM Review)" },
            { value: "APPROVED", label: "Approved (Ready for PO)" },
            { value: "CONVERTED_TO_PO", label: "Converted to PO" },
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
        <LoadingState message="Loading procurement requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No procurement requests found"
          description="Initiate procurement requests when site materials run low or are needed for upcoming phases."
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
                  <th className="py-3.5 px-4">Reason / Shortage</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {requests.map((req) => {
                  const requesterName =
                    typeof req.requestedBy === "object" && req.requestedBy !== null
                      ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                      : "User";

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                        {req.requestNumber}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {requesterName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {req.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status.toLowerCase()} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-sans">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans space-x-2">
                        {isPMOrAdmin && req.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenReview(req)}
                          >
                            Review
                          </Button>
                        )}
                        {req.status === "APPROVED" && (
                          <Link
                            to={`/projects/${projectId}/purchase-orders?prId=${req._id}`}
                            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                          >
                            Create PO →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Procurement Request Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Procurement Request"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason & Shortage Justification *
              </label>
              <Input
                placeholder="e.g. Additional 500 bags of cement required for foundation casting"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Material Line Items
                </span>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItemRow}>
                  + Add Item
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex-1 w-full">
                      <select
                        value={row.materialId}
                        onChange={(e) => handleItemChange(idx, "materialId", e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2"
                        required
                      >
                        <option value="">-- Select Material --</option>
                        {materials.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.code} - {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        value={row.requestedQuantity}
                        onChange={(e) => handleItemChange(idx, "requestedQuantity", Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price"
                        value={row.estimatedUnitPrice}
                        onChange={(e) => handleItemChange(idx, "estimatedUnitPrice", Number(e.target.value))}
                      />
                    </div>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveItemRow(idx)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="submit-immediately-chk"
                checked={submitImmediately}
                onChange={(e) => setSubmitImmediately(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="submit-immediately-chk" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Submit immediately for Project Manager approval
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? "Submitting..." : "Create Request"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Modal (PM) */}
      {isReviewModalOpen && selectedRequest && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Review Request: ${selectedRequest.requestNumber}`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-sans">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Reason: </span>
                <span>{selectedRequest.reason}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Line Items: </span>
                <span>{selectedRequest.items.length} items requested</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Review Decision
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={reviewDecision === "APPROVE"}
                    onChange={() => setReviewDecision("APPROVE")}
                  />
                  <span>Approve for Purchase Order</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={reviewDecision === "REJECT"}
                    onChange={() => setReviewDecision("REJECT")}
                  />
                  <span>Reject Request</span>
                </label>
              </div>
            </div>

            {reviewDecision === "REJECT" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <Input
                  placeholder="Specify reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={reviewing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewDecision === "APPROVE" ? "primary" : "danger"}
                disabled={reviewing}
              >
                {reviewing ? "Processing..." : `Confirm ${reviewDecision === "APPROVE" ? "Approval" : "Rejection"}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProcurementRequestsPage;
