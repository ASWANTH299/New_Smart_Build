import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";
import {
  PurchaseOrder,
  Vendor,
  ProcurementRequest,
} from "../../types/procurement.js";
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

interface POItemForm {
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export const PurchaseOrdersPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const prIdFromUrl = searchParams.get("prId");

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create PO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState(prIdFromUrl || "");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [submitForApproval, setSubmitForApproval] = useState(true);
  const [items, setItems] = useState<POItemForm[]>([
    { materialId: "", quantity: 1, unit: "", unitPrice: 0 },
  ]);

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "STORE_MANAGER";

  const fetchOrders = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [poRes, vendorRes, matRes, prRes] = await Promise.all([
        procurementService.getPurchaseOrders(projectId),
        procurementService.getVendors({ status: "ACTIVE" }),
        materialService.getMaterials({ status: "ACTIVE" }),
        procurementService.getProcurementRequests(projectId, { status: "APPROVED" }),
      ]);

      if (poRes.success && poRes.data) {
        setPurchaseOrders(poRes.data);
      }
      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data);
      }
      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
      if (prRes.success && prRes.data) {
        setApprovedRequests(prRes.data);

        // If opened from URL with prId
        if (prIdFromUrl) {
          const targetPR = prRes.data.find((p) => p._id === prIdFromUrl);
          if (targetPR) {
            setSelectedPRId(targetPR._id);
            setItems(
              targetPR.items.map((i) => ({
                materialId: typeof i.materialId === "object" ? i.materialId._id : String(i.materialId),
                quantity: i.requestedQuantity,
                unit: i.unit,
                unitPrice: i.estimatedUnitPrice || 0,
              }))
            );
            setIsCreateModalOpen(true);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [projectId, prIdFromUrl]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePRSelection = (prId: string) => {
    setSelectedPRId(prId);
    if (!prId) return;

    const pr = approvedRequests.find((p) => p._id === prId);
    if (pr) {
      setNotes(`Generated against PR: ${pr.requestNumber} - ${pr.reason}`);
      setItems(
        pr.items.map((i) => ({
          materialId: typeof i.materialId === "object" ? i.materialId._id : String(i.materialId),
          quantity: i.requestedQuantity,
          unit: i.unit,
          unitPrice: i.estimatedUnitPrice || 0,
        }))
      );
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { materialId: "", quantity: 1, unit: "", unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof POItemForm, value: unknown) => {
    const updated = [...items];
    if (field === "materialId") {
      const mat = materials.find((m) => m._id === value);
      updated[index] = {
        ...updated[index],
        materialId: String(value),
        unit: mat ? mat.unit : updated[index].unit,
        unitPrice: mat ? mat.unitPrice || 0 : updated[index].unitPrice,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const calculateSubtotal = () =>
    items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedVendorId) {
      showError("Validation Error", "Please select a vendor.");
      return;
    }

    const validItems = items.filter((i) => i.materialId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showError("Validation Error", "Please specify at least one valid line item.");
      return;
    }

    try {
      setCreating(true);
      const res = await procurementService.createPurchaseOrder(projectId, {
        procurementRequestId: selectedPRId || undefined,
        vendorId: selectedVendorId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        tax: Number(tax) || 0,
        notes: notes.trim(),
        termsAndConditions: terms.trim(),
        submitForApproval,
        items: validItems.map((i) => ({
          materialId: i.materialId,
          quantity: Number(i.quantity),
          unit: i.unit || "Units",
          unitPrice: Number(i.unitPrice) || 0,
        })),
      });

      if (res.success && res.data) {
        showSuccess("Purchase Order Created", `PO ${res.data.poNumber} created successfully.`);
        setIsCreateModalOpen(false);
        fetchOrders();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to create purchase order");
    } finally {
      setCreating(false);
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
            <span>Purchase Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Purchase Orders (PO)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Vendor orders, contract line items, delivery tracking, and receiving fulfillment.
          </p>
        </div>

        {canManage && (
          <Button
            id="create-po-btn"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Purchase Order
          </Button>
        )}
      </div>

      {/* Purchase Orders Table */}
      {loading ? (
        <LoadingState message="Loading purchase orders..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description="Create purchase orders for approved procurement requests to issue orders to suppliers."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create First Purchase Order
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
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Expected Delivery</th>
                  <th className="py-3.5 px-4">Approval</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {purchaseOrders.map((po) => {
                  const vendorName =
                    typeof po.vendorId === "object" && po.vendorId !== null
                      ? po.vendorId.name
                      : "Vendor";

                  return (
                    <tr key={po._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                        <Link to={`/projects/${projectId}/purchase-orders/${po._id}`} className="hover:underline">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        {vendorName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {po.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ${po.total?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-sans">
                        {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={po.approvalStatus.toLowerCase()} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={po.status.toLowerCase()} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Link
                          to={`/projects/${projectId}/purchase-orders/${po._id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                        >
                          View Details →
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

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Purchase Order (PO)"
        >
          <form onSubmit={handleCreatePOSubmit} className="space-y-4">
            {/* Optional PR Selection */}
            {approvedRequests.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Source from Approved Procurement Request (Optional)
                </label>
                <select
                  value={selectedPRId}
                  onChange={(e) => handlePRSelection(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2"
                >
                  <option value="">-- Direct Purchase Order --</option>
                  {approvedRequests.map((pr) => (
                    <option key={pr._id} value={pr._id}>
                      {pr.requestNumber} - {pr.reason} ({pr.items.length} items)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Supplier / Vendor *
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2"
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.code} - {v.name} ({v.address.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Delivery Date
                </label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Order Items & Pricing
                </span>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItemRow}>
                  + Add Line Item
                </Button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
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
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Unit Price"
                        value={row.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                      ${((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}
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

            {/* Financial Summary */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs space-y-1">
              <div className="w-56 space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax Amount:</span>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Cost:</span>
                  <span className="text-brand-600 dark:text-brand-400">
                    ${(calculateSubtotal() + (Number(tax) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Order Notes / Instructions
                </label>
                <Input
                  placeholder="e.g. Delivery between 8 AM and 4 PM at Site Gate 2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment & Contract Terms
                </label>
                <Input
                  placeholder="e.g. Net 30 days upon inspection approval"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="submit-po-approval-chk"
                checked={submitForApproval}
                onChange={(e) => setSubmitForApproval(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="submit-po-approval-chk" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Submit directly for Project Manager approval
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
                {creating ? "Creating PO..." : "Issue Purchase Order"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
