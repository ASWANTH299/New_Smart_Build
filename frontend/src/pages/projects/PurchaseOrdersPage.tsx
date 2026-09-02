import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
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
import Select from "../../components/ui/Select.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import SlideOverDrawer from "../../components/ui/SlideOverDrawer.js";
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

  // Create PO Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
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
            setIsCreateDrawerOpen(true);
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

  const subtotal = calculateSubtotal();
  const taxAmount = Number(tax) || 0;
  const totalAmount = subtotal + taxAmount;

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
        setIsCreateDrawerOpen(false);
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
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link to={`/projects/${projectId}`} className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Project Workspace
            </Link>
            <span>/</span>
            <span>Purchase Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Purchase Orders (PO)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Vendor orders, contract line items, delivery tracking, and receiving fulfillment.
          </p>
        </div>

        {canManage && (
          <Button
            id="create-po-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + Issue Purchase Order
          </Button>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingState message="Loading purchase orders..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          title="No Purchase Orders Found"
          description="Create vendor purchase orders to procure materials approved from engineering requisitions."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                Issue First Purchase Order
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
                  <th className="py-3.5 px-4">PO #</th>
                  <th className="py-3.5 px-4">Vendor / Supplier</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Expected Delivery</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {purchaseOrders.map((po) => {
                  const vendorName =
                    typeof po.vendorId === "object" && po.vendorId ? po.vendorId.name : "Supplier";

                  return (
                    <tr key={po._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                        <Link to={`/projects/${projectId}/purchase-orders/${po._id}`} className="hover:underline">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                        {vendorName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {po.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        ${po.total?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 font-sans">
                        {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "TBD"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={po.status.toLowerCase()} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Link
                          to={`/projects/${projectId}/purchase-orders/${po._id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5"
                        >
                          Details <ArrowRight className="w-3 h-3" />
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

      {/* Create Purchase Order SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Issue Purchase Order (PO)"
        subtitle="Generate a binding vendor contract with line items and delivery schedule"
        size="lg"
      >
        <form onSubmit={handleCreatePOSubmit} className="space-y-6">
          {/* PR Association */}
          {approvedRequests.length > 0 && (
            <Select
              id="po-pr-select"
              label="Populate from Approved Procurement Request (Optional)"
              value={selectedPRId}
              onChange={(e) => handlePRSelection(e.target.value)}
              options={[
                { value: "", label: "-- Manual Order (No Linked PR) --" },
                ...approvedRequests.map((pr) => ({
                  value: pr._id,
                  label: `${pr.requestNumber} - ${pr.reason} (${pr.items.length} items)`,
                })),
              ]}
            />
          )}

          {/* Vendor and Delivery Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="po-vendor-select"
              label="Vendor / Supplier *"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              options={[
                { value: "", label: "-- Select Approved Vendor --" },
                ...vendors.map((v) => ({
                  value: v._id,
                  label: `${v.name} (${v.code})`,
                })),
              ]}
              required
            />

            <Input
              id="po-delivery-date"
              label="Expected Delivery Date"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-display">
                Contract Line Items ({items.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddItemRow}
              >
                Add Line Item
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
                    label="Material Spec *"
                    value={item.materialId}
                    onChange={(e) => handleItemChange(idx, "materialId", e.target.value)}
                    options={[
                      { value: "", label: "-- Choose Material --" },
                      ...materials.map((m) => ({
                        value: m._id,
                        label: `${m.code} - ${m.name} (${m.unit})`,
                      })),
                    ]}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Quantity *"
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                      placeholder="e.g. Bags, Tons"
                    />
                    <Input
                      label="Unit Price ($) *"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-sans">
              <span>Subtotal:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between font-sans">
              <span className="text-zinc-600 dark:text-zinc-400">Taxes / Shipping ($):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value) || 0)}
                className="w-28 text-right px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-mono"
              />
            </div>
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">
              <span>Total PO Amount:</span>
              <span className="font-mono text-brand-600 dark:text-brand-400">
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="po-notes"
              label="Order Notes"
              placeholder="e.g. Delivery dock instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Input
              id="po-terms"
              label="Payment & Delivery Terms"
              placeholder="e.g. Net 30 days upon inspection"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={submitForApproval}
              onChange={(e) => setSubmitForApproval(e.target.checked)}
              className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Submit immediately for approval (uncheck to save as Draft)</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Create Purchase Order
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default PurchaseOrdersPage;
