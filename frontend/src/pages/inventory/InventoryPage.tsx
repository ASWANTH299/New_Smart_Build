import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import {
  InventoryBalance,
  InventoryLocation,
  InventoryTransaction,
  Material,
  StockAlert,
} from "../../types/material.js";
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

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Modal forms
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
        setIsReceiveModalOpen(false);
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
        setIsIssueModalOpen(false);
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
        setIsTransferModalOpen(false);
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
        setIsAdjustModalOpen(false);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Inventory & Warehouse Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-location stock levels, reorder threshold alerts, and audit transaction log.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              id="receive-materials-btn"
              variant="primary"
              onClick={() => setIsReceiveModalOpen(true)}
            >
              + Receive Stock
            </Button>
            <Button
              id="issue-materials-btn"
              variant="outline"
              onClick={() => setIsIssueModalOpen(true)}
            >
              - Issue Stock
            </Button>
            <Button
              id="transfer-materials-btn"
              variant="outline"
              onClick={() => setIsTransferModalOpen(true)}
            >
              ⇄ Transfer
            </Button>
            <Button
              id="adjust-stock-btn"
              variant="outline"
              onClick={() => setIsAdjustModalOpen(true)}
            >
              ± Adjust Stock
            </Button>
          </div>
        )}
      </div>

      {/* Stock Alerts Warning Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm">
            <span>⚠️</span>
            <span>Active Stock Threshold Alerts ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {alerts.slice(0, 4).map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-2.5 rounded border border-amber-200/60 dark:border-amber-800/60"
              >
                <span className="text-slate-800 dark:text-slate-200">{alert.message}</span>
                <StatusBadge
                  status={alert.type.toLowerCase()}
                  size="sm"
                  label={alert.type === "CRITICAL_LOW_STOCK" ? "Low Stock" : "Reorder"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <Select
              id="inventory-location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              options={[
                { value: "", label: "All Storage Locations" },
                ...locations.map((loc) => ({
                  value: loc._id,
                  label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central" : "Site"})`,
                })),
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="low-stock-filter-chk"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="low-stock-filter-chk" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Show Low-Stock & Reorder Items Only
            </label>
          </div>
        </div>
      </Card>

      {/* Balances Ledger Table */}
      {loading ? (
        <LoadingState message="Loading inventory balances..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInventoryData} />
      ) : balances.length === 0 ? (
        <EmptyState
          title="No inventory records found"
          description="Receive materials into central warehouse or site stores to populate inventory balances."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsReceiveModalOpen(true)}>
                Receive First Stock
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
                  <th className="py-3.5 px-4">Material</th>
                  <th className="py-3.5 px-4">Storage Location</th>
                  <th className="py-3.5 px-4 text-right">Total Quantity</th>
                  <th className="py-3.5 px-4 text-right">Reserved</th>
                  <th className="py-3.5 px-4 text-right">Available</th>
                  <th className="py-3.5 px-4 text-right">Avg. Unit Cost</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {balances.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      <Link to={`/materials/${b.materialId?._id}`} className="hover:underline text-brand-600 dark:text-brand-400">
                        {b.materialId?.code}
                      </Link>{" "}
                      - {b.materialId?.name}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                      {b.locationId?.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {b.quantity} {b.materialId?.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {b.reservedQuantity} {b.materialId?.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {b.availableQuantity} {b.materialId?.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                      ${b.averageUnitCost ? b.averageUnitCost.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.isLowStock ? (
                        <StatusBadge status="critical_low_stock" label="Low Stock" size="sm" />
                      ) : b.isReorderNeeded ? (
                        <StatusBadge status="reorder_level_reached" label="Reorder" size="sm" />
                      ) : (
                        <StatusBadge status="healthy" label="Sufficient" size="sm" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Inventory Transactions Log */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Recent Inventory Transactions Ledger
          </h2>
          <span className="text-xs text-slate-500 font-sans">
            Immutable 7-Type Audit History
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">TXN Number</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {transactions.map((t) => {
                  const mat = typeof t.materialId === "object" ? t.materialId : null;
                  return (
                    <tr key={t._id}>
                      <td className="py-3 px-4 text-brand-600 dark:text-brand-400">{t.transactionNumber}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.transactionType.toLowerCase()} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        {mat ? `${mat.code} - ${mat.name}` : "Material Item"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {t.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        ${t.totalCost?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Receive Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Materials into Inventory"
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          <Select
            id="receive-location-select"
            label="Destination Location *"
            value={receiveData.locationId}
            onChange={(e) => setReceiveData({ ...receiveData, locationId: e.target.value })}
            options={[
              { value: "", label: "-- Select Location --" },
              ...locations.map((loc) => ({
                value: loc._id,
                label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"})`,
              })),
            ]}
            required
          />

          <Select
            id="receive-material-select"
            label="Material *"
            value={receiveData.materialId}
            onChange={(e) => {
              const mat = materials.find((m) => m._id === e.target.value);
              setReceiveData({
                ...receiveData,
                materialId: e.target.value,
                unitCost: mat?.unitPrice || receiveData.unitCost,
              });
            }}
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
              label="Received Quantity *"
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
            label="Notes / PO Reference"
            placeholder="e.g. PO-2026-088 Supplier Direct Delivery"
            value={receiveData.reason}
            onChange={(e) => setReceiveData({ ...receiveData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Stock Between Locations"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="transfer-from-loc"
              label="Source Location *"
              value={transferData.fromLocationId}
              onChange={(e) => setTransferData({ ...transferData, fromLocationId: e.target.value })}
              options={[
                { value: "", label: "-- Source Location --" },
                ...locations.map((loc) => ({ value: loc._id, label: loc.name })),
              ]}
              required
            />
            <Select
              id="transfer-to-loc"
              label="Destination Location *"
              value={transferData.toLocationId}
              onChange={(e) => setTransferData({ ...transferData, toLocationId: e.target.value })}
              options={[
                { value: "", label: "-- Destination Location --" },
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Inventory Balance"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Stock Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue / Requisition Materials"
        description="Issue construction materials from storage location for site execution or requisition."
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Confirm Stock Issuance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
