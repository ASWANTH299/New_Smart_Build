import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { materialService } from "../../services/materialService.js";
import {
  InventoryBalance,
  InventoryLocation,
  InventoryTransaction,
  Material,
  StockAlert,
} from "../../types/material.js";
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

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Drawers
  const [isReceiveDrawerOpen, setIsReceiveDrawerOpen] = useState(false);
  const [isIssueDrawerOpen, setIsIssueDrawerOpen] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Drawer forms
  const [receiveData, setReceiveData] = useState({
    locationId: "",
    materialId: "",
    quantity: 1,
    unitCost: 0,
    reason: "",
  });

  const [issueData, setIssueData] = useState({
    locationId: "",
    materialId: "",
    quantity: 1,
    reason: "",
  });

  const [transferData, setTransferData] = useState({
    fromLocationId: "",
    toLocationId: "",
    materialId: "",
    quantity: 1,
    reason: "",
  });

  const [adjustData, setAdjustData] = useState({
    locationId: "",
    materialId: "",
    adjustedQuantity: 0,
    adjustmentType: "DELTA" as "DELTA" | "SET_TOTAL",
    reason: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [balRes, locRes, matRes, alertRes, txnRes] = await Promise.all([
        materialService.getBalances({
          locationId: selectedLocation || undefined,
          lowStockOnly: lowStockOnly || undefined,
        }),
        materialService.getLocations(),
        materialService.getMaterials({ status: "ACTIVE" }),
        materialService.getStockAlerts(),
        materialService.getTransactions({
          locationId: selectedLocation || undefined,
          limit: 15,
        }),
      ]);

      if (balRes.success && balRes.data) setBalances(balRes.data);
      if (locRes.success && locRes.data) setLocations(locRes.data);
      if (matRes.success && matRes.data) setMaterials(matRes.data);
      if (alertRes.success && alertRes.data) setAlerts(alertRes.data);
      if (txnRes.success && txnRes.data) setTransactions(txnRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, lowStockOnly]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Receive Submit
  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveData.locationId || !receiveData.materialId || receiveData.quantity <= 0) {
      showError("Validation Error", "Please fill in location, material and a valid quantity.");
      return;
    }

    try {
      setProcessing(true);
      const res = await materialService.receiveMaterials({
        ...receiveData,
        quantity: Number(receiveData.quantity),
        unitCost: Number(receiveData.unitCost) || 0,
      });

      if (res.success) {
        showSuccess("Receipt Processed", "Materials received into store successfully.");
        setIsReceiveDrawerOpen(false);
        setReceiveData({ locationId: "", materialId: "", quantity: 1, unitCost: 0, reason: "" });
        fetchInventoryData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to receive materials");
    } finally {
      setProcessing(false);
    }
  };

  // Issue Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueData.locationId || !issueData.materialId || issueData.quantity <= 0) {
      showError("Validation Error", "Please fill in location, material and a valid quantity.");
      return;
    }

    try {
      setProcessing(true);
      const res = await materialService.issueMaterials({
        ...issueData,
        quantity: Number(issueData.quantity),
        reason: issueData.reason.trim() || "Stock issuance from warehouse",
      });

      if (res.success) {
        showSuccess("Stock Issued", "Materials issued from store successfully.");
        setIsIssueDrawerOpen(false);
        setIssueData({ locationId: "", materialId: "", quantity: 1, reason: "" });
        fetchInventoryData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to issue materials");
    } finally {
      setProcessing(false);
    }
  };

  // Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.fromLocationId || !transferData.toLocationId || !transferData.materialId) {
      showError("Validation Error", "Please fill in source, destination and material.");
      return;
    }
    if (transferData.fromLocationId === transferData.toLocationId) {
      showError("Validation Error", "Source and destination locations cannot be the same.");
      return;
    }

    try {
      setProcessing(true);
      const res = await materialService.transferMaterials({
        ...transferData,
        quantity: Number(transferData.quantity),
      });

      if (res.success) {
        showSuccess("Transfer Completed", "Stock transferred between locations successfully.");
        setIsTransferDrawerOpen(false);
        setTransferData({ fromLocationId: "", toLocationId: "", materialId: "", quantity: 1, reason: "" });
        fetchInventoryData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to transfer stock");
    } finally {
      setProcessing(false);
    }
  };

  // Adjust Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustData.locationId || !adjustData.materialId || !adjustData.reason.trim()) {
      showError("Validation Error", "Location, material, and a mandatory reason are required for adjustments.");
      return;
    }

    try {
      setProcessing(true);
      const res = await materialService.adjustStock({
        ...adjustData,
        adjustedQuantity: Number(adjustData.adjustedQuantity),
      });

      if (res.success) {
        showSuccess("Adjustment Applied", "Stock balance adjusted successfully.");
        setIsAdjustDrawerOpen(false);
        setAdjustData({
          locationId: "",
          materialId: "",
          adjustedQuantity: 0,
          adjustmentType: "DELTA",
          reason: "",
        });
        fetchInventoryData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Inventory & Warehouse Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time multi-location stock levels, reorder threshold alerts, and audit transaction log.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              id="receive-materials-btn"
              variant="primary"
              leftIcon={<ArrowDownLeft className="w-4 h-4" />}
              onClick={() => setIsReceiveDrawerOpen(true)}
            >
              + Receive Stock
            </Button>
            <Button
              id="issue-materials-btn"
              variant="outline"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
              onClick={() => setIsIssueDrawerOpen(true)}
            >
              - Issue Stock
            </Button>
            <Button
              id="transfer-materials-btn"
              variant="outline"
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
              onClick={() => setIsTransferDrawerOpen(true)}
            >
              ⇄ Transfer
            </Button>
            <Button
              id="adjust-stock-btn"
              variant="outline"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setIsAdjustDrawerOpen(true)}
            >
              ± Adjust Stock
            </Button>
          </div>
        )}
      </div>

      {/* Stock Alerts Warning Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-xs font-display">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Active Stock Threshold Alerts ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.map((alt) => (
              <div
                key={alt.balanceId}
                className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/60 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                    {alt.material.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {alt.location.name}: {alt.availableQuantity} avail (Min: {alt.threshold})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0 font-mono">
                  LOW
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Location Selector Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              id="location-filter-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={[
                { value: "", label: "All Storage Locations" },
                ...locations.map((loc) => ({
                  value: loc._id,
                  label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Warehouse" : "Store"})`,
                })),
              ]}
              className="w-full sm:w-64"
            />

            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none shrink-0 font-display">
              <input
                id="low-stock-checkbox"
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Low Stock Alerts Only</span>
            </label>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Tracking {balances.length} active inventory balance records
          </div>
        </div>
      </Card>

      {/* Main Content View */}
      {loading ? (
        <LoadingState message="Loading inventory ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInventoryData} />
      ) : balances.length === 0 ? (
        <EmptyState
          title="No Inventory Balances Recorded"
          description="There is no stock recorded for the selected location. Perform a Stock Inward receipt to initialize inventory."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsReceiveDrawerOpen(true)}>
                Receive First Stock
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Multi-Location Balances Table */}
          <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                  <tr>
                    <th className="py-3.5 px-4">Material Spec</th>
                    <th className="py-3.5 px-4">Storage Location</th>
                    <th className="py-3.5 px-4 text-right">Total In-Stock</th>
                    <th className="py-3.5 px-4 text-right">Reserved</th>
                    <th className="py-3.5 px-4 text-right">Available Qty</th>
                    <th className="py-3.5 px-4 text-right">Avg. Unit Cost</th>
                    <th className="py-3.5 px-4">Stock Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                  {balances.map((b) => {
                    const mat = typeof b.materialId === "object" ? b.materialId : null;
                    const loc = typeof b.locationId === "object" ? b.locationId : null;
                    const isCritical = mat && b.availableQuantity <= (mat.minimumStock || 0);
                    const isReorder = mat && b.availableQuantity <= (mat.reorderLevel || 0);

                    return (
                      <tr key={b._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                          {mat ? `${mat.code} - ${mat.name}` : "Material Item"}
                        </td>
                        <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-300">
                          {loc ? loc.name : "Warehouse Location"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                          {b.quantity} {mat?.unit || "units"}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-500">
                          {b.reservedQuantity} {mat?.unit || "units"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {b.availableQuantity} {mat?.unit || "units"}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-700 dark:text-zinc-300">
                          ${b.averageUnitCost ? b.averageUnitCost.toFixed(2) : "0.00"}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCritical ? (
                            <StatusBadge status="rejected" size="sm" label="Low Stock" />
                          ) : isReorder ? (
                            <StatusBadge status="warning" size="sm" label="Reorder" />
                          ) : (
                            <StatusBadge status="approved" size="sm" label="In Stock" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Audit Transaction Ledger */}
          <Card
            title="Recent Stock Movement Ledger"
            subtitle="Immutable chronological history of inward receipts, issues, transfers, and cycle count adjustments"
          >
            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">
                No inventory transactions logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                    <tr>
                      <th className="py-2.5 px-3">TXN #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Total Cost</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 px-3 font-semibold text-brand-600 dark:text-brand-400">
                          {t.transactionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={t.transactionType.toLowerCase()} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-900 dark:text-zinc-100">
                          {typeof t.materialId === "object" && t.materialId !== null ? (t.materialId as any).name : "Material"}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-500">
                          {typeof t.locationId === "object" && t.locationId !== null ? (t.locationId as any).name : "Store"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">
                          ${t.totalCost?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-sans">
                          {new Date(t.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Receive Stock SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isReceiveDrawerOpen}
        onClose={() => setIsReceiveDrawerOpen(false)}
        title="Stock Inward (Receive Goods)"
        subtitle="Receive incoming material deliveries or purchase shipments into a storage location"
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          <Select
            id="receive-location-select"
            label="Storage Location *"
            value={receiveData.locationId}
            onChange={(e) => setReceiveData({ ...receiveData, locationId: e.target.value })}
            options={[
              { value: "", label: "-- Select Storage Location --" },
              ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
            ]}
            required
          />

          <Select
            id="receive-material-select"
            label="Material *"
            value={receiveData.materialId}
            onChange={(e) => setReceiveData({ ...receiveData, materialId: e.target.value })}
            options={[
              { value: "", label: "-- Select Material --" },
              ...materials.map((m) => ({
                value: m._id,
                label: `${m.code} - ${m.name} (${m.unit})`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="receive-quantity"
              label="Quantity Received *"
              type="number"
              min="0.01"
              step="any"
              value={receiveData.quantity}
              onChange={(e) => setReceiveData({ ...receiveData, quantity: Number(e.target.value) })}
              required
            />
            <Input
              id="receive-unit-cost"
              label="Unit Cost ($)"
              type="number"
              min="0"
              step="0.01"
              value={receiveData.unitCost}
              onChange={(e) => setReceiveData({ ...receiveData, unitCost: Number(e.target.value) })}
            />
          </div>

          <Input
            id="receive-reason"
            label="Receipt Reference / GRN"
            placeholder="e.g. PO-2026-0004 delivery batch"
            value={receiveData.reason}
            onChange={(e) => setReceiveData({ ...receiveData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsReceiveDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Process Inward Receipt
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Issue Stock SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isIssueDrawerOpen}
        onClose={() => setIsIssueDrawerOpen(false)}
        title="Issue / Requisition Materials"
        subtitle="Issue construction materials from storage location for site execution or requisition"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <Select
            id="issue-location-select"
            label="Storage Location *"
            value={issueData.locationId}
            onChange={(e) => setIssueData({ ...issueData, locationId: e.target.value })}
            options={[
              { value: "", label: "-- Select Location --" },
              ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
            ]}
            required
          />

          <Select
            id="issue-material-select"
            label="Material *"
            value={issueData.materialId}
            onChange={(e) => setIssueData({ ...issueData, materialId: e.target.value })}
            options={[
              { value: "", label: "-- Select Material --" },
              ...materials.map((m) => ({
                value: m._id,
                label: `${m.code} - ${m.name} (${m.unit})`,
              })),
            ]}
            required
          />

          <Input
            id="issue-quantity"
            label="Quantity to Issue *"
            type="number"
            min="0.01"
            step="any"
            value={issueData.quantity}
            onChange={(e) => setIssueData({ ...issueData, quantity: Number(e.target.value) })}
            required
          />

          <Input
            id="issue-reason"
            label="Issuance Reason / Work Reference *"
            placeholder="e.g. Dispatched to Site Engineer for slab reinforcement"
            value={issueData.reason}
            onChange={(e) => setIssueData({ ...issueData, reason: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsIssueDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Confirm Stock Issuance
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Transfer SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isTransferDrawerOpen}
        onClose={() => setIsTransferDrawerOpen(false)}
        title="Transfer Stock Between Locations"
        subtitle="Inter-store dispatch between Central Warehouse and Project Site Stores"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="transfer-from-select"
              label="Source Location *"
              value={transferData.fromLocationId}
              onChange={(e) => setTransferData({ ...transferData, fromLocationId: e.target.value })}
              options={[
                { value: "", label: "-- Source Store --" },
                ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
              ]}
              required
            />
            <Select
              id="transfer-to-select"
              label="Destination Location *"
              value={transferData.toLocationId}
              onChange={(e) => setTransferData({ ...transferData, toLocationId: e.target.value })}
              options={[
                { value: "", label: "-- Destination Store --" },
                ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
              ]}
              required
            />
          </div>

          <Select
            id="transfer-material-select"
            label="Material *"
            value={transferData.materialId}
            onChange={(e) => setTransferData({ ...transferData, materialId: e.target.value })}
            options={[
              { value: "", label: "-- Select Material --" },
              ...materials.map((m) => ({
                value: m._id,
                label: `${m.code} - ${m.name} (${m.unit})`,
              })),
            ]}
            required
          />

          <Input
            id="transfer-quantity"
            label="Transfer Quantity *"
            type="number"
            min="0.01"
            step="any"
            value={transferData.quantity}
            onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
            required
          />

          <Input
            id="transfer-reason"
            label="Transfer Reason"
            placeholder="e.g. Site dispatch for foundation concrete batching"
            value={transferData.reason}
            onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsTransferDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Adjust SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isAdjustDrawerOpen}
        onClose={() => setIsAdjustDrawerOpen(false)}
        title="Adjust Inventory Balance"
        subtitle="Physical inventory cycle count variance correction with mandatory audit reason"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Select
            id="adjust-location-select"
            label="Location *"
            value={adjustData.locationId}
            onChange={(e) => setAdjustData({ ...adjustData, locationId: e.target.value })}
            options={[
              { value: "", label: "-- Select Location --" },
              ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
            ]}
            required
          />

          <Select
            id="adjust-material-select"
            label="Material *"
            value={adjustData.materialId}
            onChange={(e) => setAdjustData({ ...adjustData, materialId: e.target.value })}
            options={[
              { value: "", label: "-- Select Material --" },
              ...materials.map((m) => ({
                value: m._id,
                label: `${m.code} - ${m.name} (${m.unit})`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="adjust-type-select"
              label="Adjustment Mode *"
              value={adjustData.adjustmentType}
              onChange={(e) =>
                setAdjustData({
                  ...adjustData,
                  adjustmentType: e.target.value as "DELTA" | "SET_TOTAL",
                })
              }
              options={[
                { value: "DELTA", label: "Relative Delta (+ / -)" },
                { value: "SET_TOTAL", label: "Set Absolute Total" },
              ]}
              required
            />
            <Input
              id="adjust-quantity"
              label="Adjusted Quantity *"
              type="number"
              step="any"
              value={adjustData.adjustedQuantity}
              onChange={(e) => setAdjustData({ ...adjustData, adjustedQuantity: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            id="adjust-reason-input"
            label="Mandatory Reason *"
            placeholder="e.g. Physical inventory cycle count variance correction"
            value={adjustData.reason}
            onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsAdjustDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default InventoryPage;
