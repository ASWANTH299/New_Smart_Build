import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { procurementService } from "../../services/procurementService.js";
import { MaterialReceipt } from "../../types/procurement.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const ReceivingPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected receipt for detail inspection
  const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceipt | null>(null);

  const fetchReceipts = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await procurementService.getMaterialReceipts(projectId);
      if (res.success && res.data) {
        setReceipts(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load material receipts");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

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
            <span>Material Receiving</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Material Receiving & Inspection Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store goods receipt notes (GRN), delivery verification, inspection reports, and inventory updates.
          </p>
        </div>

        <Link to={`/projects/${projectId}/purchase-orders`}>
          <Button variant="outline">
            View Purchase Orders →
          </Button>
        </Link>
      </div>

      {/* Receipts Table */}
      {loading ? (
        <LoadingState message="Loading goods receipt records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReceipts} />
      ) : receipts.length === 0 ? (
        <EmptyState
          title="No material receipts found"
          description="Material receipts will be logged here whenever goods are received and verified against purchase orders."
        />
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Purchase Order</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Storage Location</th>
                  <th className="py-3.5 px-4">Invoice / Challan</th>
                  <th className="py-3.5 px-4 text-center">Items Received</th>
                  <th className="py-3.5 px-4">Received Date</th>
                  <th className="py-3.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {receipts.map((mr) => {
                  const poNum =
                    typeof mr.purchaseOrderId === "object" && mr.purchaseOrderId !== null
                      ? mr.purchaseOrderId.poNumber
                      : "PO";

                  const poId =
                    typeof mr.purchaseOrderId === "object" && mr.purchaseOrderId !== null
                      ? mr.purchaseOrderId._id
                      : String(mr.purchaseOrderId);

                  const vendorName =
                    typeof mr.vendorId === "object" && mr.vendorId !== null
                      ? mr.vendorId.name
                      : "Vendor";

                  const locationName =
                    typeof mr.locationId === "object" && mr.locationId !== null
                      ? mr.locationId.name
                      : "Main Warehouse";

                  return (
                    <tr key={mr._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                        {mr.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/projects/${projectId}/purchase-orders/${poId}`}
                          className="hover:underline text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          {poNum}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        {vendorName}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                        {locationName}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-500">
                        {mr.invoiceNumber || mr.deliveryChallanNumber || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {mr.items?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-500">
                        {new Date(mr.receivedAt || mr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedReceipt(mr)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                        >
                          View Inspection →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Material Receipt Inspection Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`Goods Receipt: ${selectedReceipt.receiptNumber}`}
        >
          <div className="space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Invoice Number:</span>{" "}
                <span className="font-semibold">{selectedReceipt.invoiceNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500">Delivery Challan:</span>{" "}
                <span className="font-semibold">{selectedReceipt.deliveryChallanNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500">Received On:</span>{" "}
                <span className="font-semibold">
                  {new Date(selectedReceipt.receivedAt || selectedReceipt.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedReceipt.notes && (
                <div className="col-span-2">
                  <span className="text-slate-500">Remarks:</span>{" "}
                  <span>{selectedReceipt.notes}</span>
                </div>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3 text-right">Delivered</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">Accepted</th>
                    <th className="py-2.5 px-3 text-right text-red-500">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono">
                  {selectedReceipt.items.map((item, idx) => {
                    const matName =
                      typeof item.materialId === "object" && item.materialId !== null
                        ? `${item.materialId.code} - ${item.materialId.name}`
                        : "Material";

                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {matName}
                        </td>
                        <td className="py-2 px-3 text-right">{item.receivedQuantity}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {item.acceptedQuantity}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-red-500">
                          {item.rejectedQuantity || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReceivingPage;
