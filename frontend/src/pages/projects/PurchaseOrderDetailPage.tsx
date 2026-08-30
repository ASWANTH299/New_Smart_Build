import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";
import { PurchaseOrder } from "../../types/procurement.js";
import { InventoryLocation } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const PurchaseOrderDetailPage: React.FC = () => {
  const { projectId, orderId } = useParams<{ projectId: string; orderId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approve/Reject Modal (PM / Admin)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [approving, setApproving] = useState(false);

  // Receive Materials Modal (Store Manager)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, { received: number; accepted: number; rejected: number; rejectionReason?: string }>
  >({});

  const isPMOrAdmin =
    user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";

  const canReceive =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchPODetails = useCallback(async () => {
    if (!projectId || !orderId) return;
    try {
      setLoading(true);
      setError(null);
      const [poRes, locRes] = await Promise.all([
        procurementService.getPurchaseOrderById(projectId, orderId),
        materialService.getLocations(projectId),
      ]);

      if (poRes.success && poRes.data) {
        setPO(poRes.data);

        // Initialize receive quantities to unfulfilled quantities
        const defaultQtys: Record<
          string,
          { received: number; accepted: number; rejected: number; rejectionReason?: string }
        > = {};
        poRes.data.items.forEach((item) => {
          const matId = typeof item.materialId === "object" ? item.materialId._id : String(item.materialId);
          const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
          defaultQtys[matId] = { received: remaining, accepted: remaining, rejected: 0, rejectionReason: "" };
        });
        setReceiveQuantities(defaultQtys);
      }

      if (locRes.success && locRes.data) {
        setLocations(locRes.data);
        if (locRes.data.length > 0) {
          setSelectedLocationId(locRes.data[0]._id);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load purchase order details");
    } finally {
      setLoading(false);
    }
  }, [projectId, orderId]);

  useEffect(() => {
    fetchPODetails();
  }, [fetchPODetails]);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !orderId) return;

    try {
      setApproving(true);
      const res = await procurementService.approvePurchaseOrder(projectId, orderId, {
        decision,
        notes: reviewNotes,
      });

      if (res.success) {
        showSuccess("PO Status Updated", `Purchase Order ${decision.toLowerCase()}d successfully.`);
        setIsApproveModalOpen(false);
        fetchPODetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to update PO status");
    } finally {
      setApproving(false);
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !orderId || !selectedLocationId) {
      showError("Validation Error", "Please select a destination storage location.");
      return;
    }

    const itemsToReceive = Object.entries(receiveQuantities)
      .filter(([_, q]) => Number(q.accepted) > 0 || Number(q.rejected) > 0)
      .map(([matId, q]) => ({
        materialId: matId,
        receivedQuantity: Number(q.received),
        acceptedQuantity: Number(q.accepted),
        rejectedQuantity: Number(q.rejected) || 0,
        rejectionReason: q.rejectionReason,
      }));

    if (itemsToReceive.length === 0) {
      showError("Validation Error", "Please specify accepted or received quantities for at least one item.");
      return;
    }

    try {
      setReceiving(true);
      const res = await procurementService.recordMaterialReceipt(projectId, {
        purchaseOrderId: orderId,
        locationId: selectedLocationId,
        invoiceNumber,
        deliveryChallanNumber: challanNumber,
        notes: receiptNotes,
        items: itemsToReceive,
      });

      if (res.success && res.data) {
        showSuccess(
          "Materials Received",
          `Receipt ${res.data.receipt.receiptNumber} recorded and inventory ledger updated.`
        );
        setIsReceiveModalOpen(false);
        fetchPODetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to process material receipt");
    } finally {
      setReceiving(false);
    }
  };

  if (loading) return <LoadingState message="Loading purchase order..." />;
  if (error || !po) return <ErrorState message={error || "Purchase order not found"} onRetry={fetchPODetails} />;

  const vendorName =
    typeof po.vendorId === "object" && po.vendorId !== null ? po.vendorId.name : "Supplier";
  const vendorCode =
    typeof po.vendorId === "object" && po.vendorId !== null ? po.vendorId.code : "VEN";

  const isFulfilled = po.status === "FULFILLED";
  const isApproved = po.approvalStatus === "APPROVED";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link
            to={`/projects/${projectId}/purchase-orders`}
            className="hover:underline text-brand-600 dark:text-brand-400 font-medium"
          >
            ← Purchase Orders
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{po.poNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          {isPMOrAdmin && po.approvalStatus === "PENDING_APPROVAL" && (
            <Button variant="primary" onClick={() => setIsApproveModalOpen(true)}>
              Approve / Reject PO
            </Button>
          )}

          {canReceive && isApproved && !isFulfilled && (
            <Button variant="primary" onClick={() => setIsReceiveModalOpen(true)}>
              + Receive Materials into Store
            </Button>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {po.poNumber}
              </span>
              <StatusBadge status={po.approvalStatus.toLowerCase()} />
              <StatusBadge status={po.status.toLowerCase()} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
              {vendorName} ({vendorCode})
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Expected Delivery:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "Flexible / On Demand"}
              </span>
              {po.notes && ` | Note: ${po.notes}`}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-right">
            <div className="text-xs text-slate-500 font-sans">Total Order Value</div>
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              ${po.total?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-sans">
              Subtotal: ${po.subtotal?.toFixed(2)} | Tax: ${po.tax?.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items & Receiving Progress */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white text-base">
          Ordered Materials & Delivery Fulfillment
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4 text-right">Ordered Qty</th>
                <th className="py-3.5 px-4 text-right">Received Qty</th>
                <th className="py-3.5 px-4 text-right">Pending Qty</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
              {po.items.map((item, idx) => {
                const mat = typeof item.materialId === "object" ? item.materialId : null;
                const matCode = mat ? mat.code : "MAT";
                const matName = mat ? mat.name : "Material Item";
                const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      <span className="font-mono text-brand-600 dark:text-brand-400 font-bold mr-1">
                        {matCode}
                      </span>
                      - {matName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.receivedQuantity || 0} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      {remaining} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                      ${item.unitPrice?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      ${item.total?.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal (PM) */}
      {isApproveModalOpen && (
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          title={`Review Purchase Order ${po.poNumber}`}
        >
          <form onSubmit={handleApproveSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-sans">
              <div>
                <span className="font-semibold">Supplier:</span> {vendorName}
              </div>
              <div>
                <span className="font-semibold">Order Total:</span> ${po.total?.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Decision
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={decision === "APPROVE"}
                    onChange={() => setDecision("APPROVE")}
                  />
                  <span>Approve & Issue to Vendor</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={decision === "REJECT"}
                    onChange={() => setDecision("REJECT")}
                  />
                  <span>Reject Purchase Order</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Review Notes
              </label>
              <Input
                placeholder="Optional comments or instructions..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decision === "APPROVE" ? "primary" : "danger"}
                disabled={approving}
              >
                {approving ? "Processing..." : `Confirm ${decision === "APPROVE" ? "Approval" : "Rejection"}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receive Materials Modal (Store Manager) */}
      {isReceiveModalOpen && (
        <Modal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          title={`Receive Materials for PO: ${po.poNumber}`}
        >
          <form onSubmit={handleReceiveSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Destination Storage Location *
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2"
                  required
                >
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type === "CENTRAL_WAREHOUSE" ? "Central" : "Site"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Invoice Number
                </label>
                <Input
                  placeholder="e.g. INV-88219"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Challan #
                </label>
                <Input
                  placeholder="e.g. DC-4412"
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Inspection & Quantity Entry */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Verify Line Item Deliveries
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {po.items.map((item, idx) => {
                  const matId = typeof item.materialId === "object" ? item.materialId._id : String(item.materialId);
                  const matName = typeof item.materialId === "object" ? item.materialId.name : "Material Item";
                  const q = receiveQuantities[matId] || { received: 0, accepted: 0, rejected: 0 };
                  const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {matName}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Remaining on PO: {remaining} {item.unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Delivered Qty</label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={q.received}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setReceiveQuantities({
                                ...receiveQuantities,
                                [matId]: { ...q, received: val, accepted: val },
                              });
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                            Accepted Qty (Stores)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            step="any"
                            value={q.accepted}
                            onChange={(e) =>
                              setReceiveQuantities({
                                ...receiveQuantities,
                                [matId]: { ...q, accepted: Number(e.target.value) },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-red-500 mb-0.5">Damaged / Rejected</label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={q.rejected}
                            onChange={(e) =>
                              setReceiveQuantities({
                                ...receiveQuantities,
                                [matId]: { ...q, rejected: Number(e.target.value) },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Receipt Inspection Notes
              </label>
              <Input
                placeholder="Remarks on condition, batch quality, vehicle info..."
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReceiveModalOpen(false)}
                disabled={receiving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={receiving}>
                {receiving ? "Processing Receiving..." : "Confirm & Update Inventory"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;
