import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import {
  InventoryLocation,
  InventoryBalance,
  InventoryTransaction,
} from "../../types/material.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import LoadingState from "../../components/ui/LoadingState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const InventoryDetailPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const { showError } = useToast();

  const [location, setLocation] = useState<InventoryLocation | null>(null);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!locationId) return;
    try {
      setLoading(true);
      setError(null);
      const [locRes, balRes, txnRes] = await Promise.all([
        materialService.getLocations(),
        materialService.getBalances({ locationId }),
        materialService.getTransactions({ locationId, limit: 15 }),
      ]);

      if (locRes.success && locRes.data) {
        const target = locRes.data.find((l) => l._id === locationId);
        if (target) setLocation(target);
      }
      if (balRes.success && balRes.data) {
        setBalances(balRes.data);
      }
      if (txnRes.success && txnRes.data) {
        setTransactions(txnRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load location details";
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [locationId, showError]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <LoadingState message="Loading location inventory..." />;
  if (error || !location) return <ErrorState message={error || "Location not found"} onRetry={fetchDetails} />;

  const totalSKUs = balances.length;
  const lowStockSKUs = balances.filter((b) => b.isLowStock || b.isReorderNeeded).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/inventory" className="hover:underline text-brand-600 dark:text-brand-400 font-medium">
            ← Inventory & Warehouses
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{location.name}</span>
        </div>
      </div>

      {/* Header Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {location.code || "LOC-STORE"}
              </span>
              <StatusBadge status={location.status.toLowerCase()} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {location.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Type: <span className="font-medium text-slate-700 dark:text-slate-300">{location.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Project Site Store"}</span>
              {location.address && ` | Address: ${location.address}`}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
            <div>
              <div className="text-xs text-slate-500 font-sans">Stocked SKUs</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{totalSKUs}</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-xs text-slate-500 font-sans">Low-Stock Warnings</div>
              <div className={`text-xl font-bold ${lowStockSKUs > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600"}`}>
                {lowStockSKUs}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stock Balances at this Location */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white text-base">
          Current Stock Balances
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4 text-right">Total Quantity</th>
                <th className="py-3.5 px-4 text-right">Reserved</th>
                <th className="py-3.5 px-4 text-right">Available</th>
                <th className="py-3.5 px-4 text-right">Avg. Unit Cost</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No material balances recorded at this storage location.
                  </td>
                </tr>
              ) : (
                balances.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      <Link to={`/materials/${b.materialId?._id}`} className="hover:underline text-brand-600 dark:text-brand-400">
                        {b.materialId?.code}
                      </Link>{" "}
                      - {b.materialId?.name}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement Ledger */}
      <Card className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Recent Location Movements
        </h2>
        {transactions.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center font-sans">
            No transactions recorded at this location.
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
                  <th className="py-3 px-4">Date</th>
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
                        {new Date(t.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InventoryDetailPage;
