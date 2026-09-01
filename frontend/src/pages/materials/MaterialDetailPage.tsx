import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { materialService } from "../../services/materialService.js";
import { Material, InventoryBalance, InventoryTransaction, InventoryLocation } from "../../types/material.js";
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

export const MaterialDetailPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Material>>({});

  // Quick Inward (Receive) Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveLocationId, setReceiveLocationId] = useState("");
  const [receiveQuantity, setReceiveQuantity] = useState(10);
  const [receiveUnitCost, setReceiveUnitCost] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);

  // Quick Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueLocationId, setIssueLocationId] = useState("");
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueReason, setIssueReason] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchMaterialDetails = useCallback(async () => {
    if (!materialId) return;
    try {
      setLoading(true);
      setError(null);
      const [matRes, balRes, txnRes, locRes] = await Promise.all([
        materialService.getMaterialById(materialId),
        materialService.getBalances({ materialId }),
        materialService.getTransactions({ materialId, limit: 15 }),
        materialService.getLocations(),
      ]);

      if (matRes.success && matRes.data) {
        setMaterial(matRes.data);
        setEditFormData(matRes.data);
        setReceiveUnitCost(matRes.data.unitPrice || 0);
      }
      if (balRes.success && balRes.data) {
        setBalances(balRes.data);
      }
      if (txnRes.success && txnRes.data) {
        setTransactions(txnRes.data);
      }
      if (locRes.success && locRes.data) {
        const locList = locRes.data;
        setLocations(locList);
        if (locList.length > 0) {
          setReceiveLocationId((prev) => prev || locList[0]._id);
          setIssueLocationId((prev) => prev || locList[0]._id);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load material details");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    fetchMaterialDetails();
  }, [fetchMaterialDetails]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return;

    try {
      setUpdating(true);
      const res = await materialService.updateMaterial(materialId, {
        name: editFormData.name,
        category: editFormData.category,
        unit: editFormData.unit,
        specifications: editFormData.specifications,
        minimumStock: Number(editFormData.minimumStock) || 0,
        reorderLevel: Number(editFormData.reorderLevel) || 0,
        unitPrice: Number(editFormData.unitPrice) || 0,
        notes: editFormData.notes,
      });

      if (res.success && res.data) {
        setMaterial(res.data);
        showSuccess("Material Updated", "Material updated successfully.");
        setIsEditModalOpen(false);
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to update material");
    } finally {
      setUpdating(false);
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !receiveLocationId || receiveQuantity <= 0) {
      showError("Validation Error", "Please specify a valid storage location and quantity.");
      return;
    }

    setIsReceiving(true);
    try {
      const res = await materialService.receiveMaterials({
        locationId: receiveLocationId,
        materialId: material._id,
        quantity: Number(receiveQuantity),
        unitCost: Number(receiveUnitCost) || 0,
        reason: "Stock inward receipt",
      });

      if (res.success) {
        showSuccess("Stock Received", `Received ${receiveQuantity} ${material.unit} into storage location.`);
        setIsReceiveModalOpen(false);
        fetchMaterialDetails();
      }
    } catch (err: unknown) {
      showError("Receipt Failed", err instanceof Error ? err.message : "Error receiving stock.");
    } finally {
      setIsReceiving(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !issueLocationId || issueQuantity <= 0) {
      showError("Validation Error", "Please specify a valid storage location and quantity.");
      return;
    }

    setIsIssuing(true);
    try {
      const res = await materialService.issueMaterials({
        locationId: issueLocationId,
        materialId: material._id,
        quantity: Number(issueQuantity),
        reason: issueReason.trim() || "Stock issued for project execution",
      });

      if (res.success) {
        showSuccess("Stock Issued", `Issued ${issueQuantity} ${material.unit} from store.`);
        setIsIssueModalOpen(false);
        fetchMaterialDetails();
      }
    } catch (err: unknown) {
      showError("Issue Failed", err instanceof Error ? err.message : "Error issuing stock.");
    } finally {
      setIsIssuing(false);
    }
  };

  const totalStock = balances.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const totalAvailable = balances.reduce((sum, b) => sum + (b.availableQuantity || 0), 0);

  if (loading) return <LoadingState message="Loading material details..." />;
  if (error || !material) return <ErrorState message={error || "Material not found"} onRetry={fetchMaterialDetails} />;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/materials" className="hover:underline text-brand-600 dark:text-brand-400 font-medium">
            ← Materials Catalog
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{material.code}</span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              Edit Material
            </Button>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {material.code}
              </span>
              <StatusBadge status={material.status.toLowerCase()} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {material.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Category: <span className="font-medium text-slate-700 dark:text-slate-300">{material.category}</span> | Unit: <span className="font-medium text-slate-700 dark:text-slate-300">{material.unit}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total System Stock</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {totalStock} <span className="text-xs font-normal text-slate-500">{material.unit}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Available</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {totalAvailable} <span className="text-xs font-normal text-slate-500">{material.unit}</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<ArrowDownLeft className="w-4 h-4" />}
                  onClick={() => {
                    setReceiveQuantity(material.reorderLevel || 10);
                    setIsReceiveModalOpen(true);
                  }}
                >
                  + Inward Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowUpRight className="w-4 h-4" />}
                  onClick={() => {
                    setIssueQuantity(1);
                    setIsIssueModalOpen(true);
                  }}
                >
                  - Issue Stock
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Specifications & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 md:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Technical Specifications & Notes
          </h2>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Specifications</div>
            <div className="text-sm text-slate-800 dark:text-slate-200 mt-1">
              {material.specifications || "No technical specifications recorded."}
            </div>
          </div>
          {material.notes && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">General Notes</div>
              <div className="text-sm text-slate-800 dark:text-slate-200 mt-1">
                {material.notes}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Thresholds & Pricing
          </h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">Min. Safe Stock:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{material.minimumStock} {material.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">Reorder Level:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{material.reorderLevel} {material.unit}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">Est. Unit Price:</span>
              <span className="font-semibold text-slate-900 dark:text-white">${material.unitPrice ? material.unitPrice.toFixed(2) : "0.00"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Multi-Location Inventory Balances */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Storage Location Balances
          </h2>
          <Link to="/inventory" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Open Full Inventory Ledger →
          </Link>
        </div>

        {balances.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No stock currently located in central warehouse or site stores.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Total Quantity</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Available Quantity</th>
                  <th className="py-3 px-4 text-right">Avg. Unit Cost</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {balances.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      {b.locationId?.name || "Unknown Location"}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">
                      {b.locationId?.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"}
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold text-right">
                      {b.quantity} {material.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-right">
                      {b.reservedQuantity} {material.unit}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                      {b.availableQuantity} {material.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-right">
                      ${b.averageUnitCost ? b.averageUnitCost.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-3 px-4">
                      {b.availableQuantity <= (material.minimumStock || 0) ? (
                        <StatusBadge status="rejected" size="sm" label="Low Stock" />
                      ) : b.availableQuantity <= (material.reorderLevel || 0) ? (
                        <StatusBadge status="warning" size="sm" label="Reorder" />
                      ) : (
                        <StatusBadge status="approved" size="sm" label="In Stock" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      <Card className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Recent Material Movement History
        </h2>
        {transactions.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No transaction records found for this material.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">TXN #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-brand-600 dark:text-brand-400">{t.transactionNumber}</td>
                    <td className="py-3 px-4"><StatusBadge status={t.transactionType.toLowerCase()} size="sm" /></td>
                    <td className="py-3 px-4 font-sans">{typeof t.locationId === "object" && t.locationId !== null ? (t.locationId as any).name : "Store"}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold text-right">{t.quantity} {material.unit}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white text-right">${t.totalCost?.toFixed(2) || "0.00"}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">{new Date(t.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Inward (Receive) Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Stock Inward: ${material.name}`}
        description="Receive incoming shipment or purchase into store inventory."
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          <Select
            label="Storage Location *"
            options={locations.map((loc) => ({
              value: loc._id,
              label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"})`,
            }))}
            value={receiveLocationId}
            onChange={(e) => setReceiveLocationId(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Quantity (${material.unit}) *`}
              type="number"
              min={0.01}
              step="any"
              value={receiveQuantity}
              onChange={(e) => setReceiveQuantity(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Unit Cost ($)"
              type="number"
              min={0}
              step="any"
              value={receiveUnitCost}
              onChange={(e) => setReceiveUnitCost(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isReceiving} leftIcon={<ArrowDownLeft className="w-4 h-4" />}>
              Confirm Inward Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={`Issue Stock: ${material.name}`}
        description="Issue materials from inventory for construction work or contractor dispatch."
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <Select
            label="Storage Location *"
            options={locations.map((loc) => ({
              value: loc._id,
              label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"})`,
            }))}
            value={issueLocationId}
            onChange={(e) => setIssueLocationId(e.target.value)}
            required
          />

          <Input
            label={`Quantity to Issue (${material.unit}) *`}
            type="number"
            min={0.01}
            step="any"
            value={issueQuantity}
            onChange={(e) => setIssueQuantity(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Requisition / Work Reference *"
            placeholder="e.g. Site team requisition for foundation pour"
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isIssuing} leftIcon={<ArrowUpRight className="w-4 h-4" />}>
              Confirm Stock Issuance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Material: ${material.code}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            id="edit-material-name"
            label="Material Name *"
            value={editFormData.name || ""}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-material-category"
              label="Category *"
              value={editFormData.category || ""}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              required
            />
            <Input
              id="edit-material-unit"
              label="Standard Unit (UOM) *"
              value={editFormData.unit || ""}
              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="edit-material-min-stock"
              label="Min Safe Stock"
              type="number"
              value={editFormData.minimumStock || 0}
              onChange={(e) => setEditFormData({ ...editFormData, minimumStock: Number(e.target.value) })}
            />
            <Input
              id="edit-material-reorder"
              label="Reorder Level"
              type="number"
              value={editFormData.reorderLevel || 0}
              onChange={(e) => setEditFormData({ ...editFormData, reorderLevel: Number(e.target.value) })}
            />
            <Input
              id="edit-material-price"
              label="Est. Unit Price ($)"
              type="number"
              step="0.01"
              value={editFormData.unitPrice || 0}
              onChange={(e) => setEditFormData({ ...editFormData, unitPrice: Number(e.target.value) })}
            />
          </div>

          <Input
            id="edit-material-specs"
            label="Technical Specifications"
            value={editFormData.specifications || ""}
            onChange={(e) => setEditFormData({ ...editFormData, specifications: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialDetailPage;
