import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import { MaterialRequest, InventoryLocation } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import ErrorState from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";

export const MaterialRequestDetailPage: React.FC = () => {
  const { projectId, requestId } = useParams<{ projectId: string; requestId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue Modal (Store Manager)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [issueQuantities, setIssueQuantities] = useState<Record<string, number>>({});
  const [issuing, setIssuing] = useState(false);

  const canIssue =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchDetails = useCallback(async () => {
    if (!projectId || !requestId) return;
    try {
      setLoading(true);
      setError(null);
      const [reqRes, locRes] = await Promise.all([
        materialService.getMaterialRequestById(projectId, requestId),
        materialService.getLocations(projectId),
      ]);

      if (reqRes.success && reqRes.data) {
        setRequest(reqRes.data);
        // Default issue quantities to remaining approved quantities
        const defaultQtys: Record<string, number> = {};
        reqRes.data.items.forEach((item) => {
          const matId = typeof item.materialId === "object" ? item.materialId._id : String(item.materialId);
          const remaining = (item.approvedQuantity || 0) - (item.issuedQuantity || 0);
          defaultQtys[matId] = Math.max(0, remaining);
        });
        setIssueQuantities(defaultQtys);
      }

      if (locRes.success && locRes.data) {
        setLocations(locRes.data);
        if (locRes.data.length > 0) {
          setSelectedLocationId(locRes.data[0]._id);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load request details");
    } finally {
      setLoading(false);
    }
  }, [projectId, requestId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleSubmitDraft = async () => {
    if (!projectId || !requestId) return;
    try {
      const res = await materialService.submitMaterialRequest(projectId, requestId);
      if (res.success) {
        showSuccess("Request Submitted", "Request submitted for Project Manager review.");
        fetchDetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !requestId || !selectedLocationId) {
      showError("Validation Error", "Please select an inventory location.");
      return;
    }

    const itemsToIssue = Object.entries(issueQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([materialId, qty]) => ({
        materialId,
        quantityToIssue: Number(qty),
      }));

    if (itemsToIssue.length === 0) {
      showError("Validation Error", "Please specify a quantity to issue for at least one item.");
      return;
    }

    try {
      setIssuing(true);
      const res = await materialService.issueMaterialRequest(projectId, requestId, {
        locationId: selectedLocationId,
        items: itemsToIssue,
      });

      if (res.success) {
        showSuccess("Materials Issued", "Materials issued successfully against request.");
        setIsIssueModalOpen(false);
        fetchDetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to issue materials");
    } finally {
      setIssuing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!projectId || !requestId) return;
    if (!confirm("Are you sure you want to cancel this material request?")) return;

    try {
      const res = await materialService.cancelMaterialRequest(projectId, requestId);
      if (res.success) {
        showSuccess("Request Cancelled", "Material request cancelled.");
        fetchDetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to cancel request");
    }
  };

  if (loading) return <LoadingState message="Loading request details..." />;
  if (error || !request) return <ErrorState message={error || "Request not found"} onRetry={fetchDetails} />;

  const requesterName =
    typeof request.requestedBy === "object" && request.requestedBy !== null
      ? `${request.requestedBy.firstName} ${request.requestedBy.lastName} (${request.requestedBy.email})`
      : "Site Engineer";

  const reviewerName =
    typeof request.reviewedBy === "object" && request.reviewedBy !== null
      ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`
      : "Project Manager";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link
            to={`/projects/${projectId}/material-requests`}
            className="hover:underline text-brand-600 dark:text-brand-400 font-medium"
          >
            ← Material Requests
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{request.requestNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          {request.status === "DRAFT" && (
            <Button variant="primary" size="sm" onClick={handleSubmitDraft}>
              Submit for Approval
            </Button>
          )}

          {canIssue && (request.status === "APPROVED" || request.status === "PARTIALLY_ISSUED") && (
            <Button
              id="open-issue-dialog-btn"
              variant="primary"
              size="sm"
              onClick={() => setIsIssueModalOpen(true)}
            >
              📦 Issue Materials from Store
            </Button>
          )}

          {(request.status === "DRAFT" || request.status === "SUBMITTED") && (
            <Button variant="outline" size="sm" onClick={handleCancelRequest}>
              Cancel Request
            </Button>
          )}
        </div>
      </div>

      {/* Header Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                {request.requestNumber}
              </span>
              <StatusBadge status={request.status.toLowerCase()} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {request.reason}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Requested by: <span className="font-medium text-slate-700 dark:text-slate-300">{requesterName}</span> on {request.createdAt ? new Date(request.createdAt).toLocaleString() : "-"}
            </p>
          </div>

          {request.reviewedBy && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Reviewed by {reviewerName}
              </div>
              <div className="text-slate-500 mt-0.5">
                {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : ""}
              </div>
              {request.rejectionReason && (
                <div className="mt-2 text-red-600 dark:text-red-400 font-medium">
                  Reason: {request.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Requisition Line Items */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white text-base">
          Requisitioned Items
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4 text-right">Requested Qty</th>
                <th className="py-3.5 px-4 text-right">Approved Qty</th>
                <th className="py-3.5 px-4 text-right">Issued Qty</th>
                <th className="py-3.5 px-4 text-right">Remaining to Issue</th>
                <th className="py-3.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
              {request.items.map((item, idx) => {
                const mat = typeof item.materialId === "object" ? item.materialId : null;
                const matName = mat ? `${mat.code} - ${mat.name}` : "Material Item";
                const remaining = (item.approvedQuantity || 0) - (item.issuedQuantity || 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      {matName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {item.requestedQuantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-brand-600 dark:text-brand-400 font-semibold">
                      {item.approvedQuantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.issuedQuantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {Math.max(0, remaining)} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500">
                      {item.notes || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Store Manager Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={`Issue Materials for Request ${request.requestNumber}`}
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <Select
            id="issue-location-select"
            label="Source Inventory Store / Warehouse *"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            options={locations.map((loc) => ({
              value: loc._id,
              label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"})`,
            }))}
            required
          />

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Line Items Issuance Quantities
            </label>
            {request.items.map((item, idx) => {
              const mat = typeof item.materialId === "object" ? item.materialId : null;
              const matId = mat ? mat._id : String(item.materialId);
              const remaining = (item.approvedQuantity || 0) - (item.issuedQuantity || 0);

              if (remaining <= 0) return null;

              return (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {mat ? `${mat.code} - ${mat.name}` : "Material"}
                    </span>
                    <span className="text-slate-500 font-mono">
                      Approved: {item.approvedQuantity} | Remaining: {remaining} {item.unit}
                    </span>
                  </div>
                  <Input
                    id={`issue-qty-${matId}`}
                    type="number"
                    min="0.01"
                    max={remaining}
                    step="any"
                    label={`Quantity to Issue (${item.unit})`}
                    value={issueQuantities[matId] ?? remaining}
                    onChange={(e) =>
                      setIssueQuantities({
                        ...issueQuantities,
                        [matId]: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={issuing}>
              Confirm Stock Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialRequestDetailPage;
