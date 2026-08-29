import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import { BOM, BOMItem, Material } from "../../types/material.js";
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

export const BOMPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [boms, setBoms] = useState<BOM[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [items, setItems] = useState<BOMItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Forms
  const [newVersionNotes, setNewVersionNotes] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [newItemData, setNewItemData] = useState({
    materialId: "",
    plannedQuantity: 1,
    unit: "",
    unitCost: 0,
    notes: "",
  });

  const isPMOrAdmin =
    user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";

  const fetchBOMDetail = useCallback(async (bomId: string) => {
    if (!projectId) return;
    try {
      const res = await materialService.getBOMById(projectId, bomId);
      if (res.success && res.data) {
        setSelectedBOM(res.data.bom);
        setItems(res.data.items || []);
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to load BOM items");
    }
  }, [projectId, showError]);

  const fetchBOMs = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [bomRes, matRes] = await Promise.all([
        materialService.getProjectBOMs(projectId),
        materialService.getMaterials({ status: "ACTIVE" }),
      ]);

      if (bomRes.success && bomRes.data) {
        setBoms(bomRes.data);
        if (bomRes.data.length > 0) {
          // Select active BOM by default or first one
          const activeOrLatest =
            bomRes.data.find((b) => b.status === "ACTIVE") || bomRes.data[0];
          setSelectedBOM(activeOrLatest);
          fetchBOMDetail(activeOrLatest._id);
        }
      }
      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load Project BOMs");
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchBOMDetail]);

  useEffect(() => {
    fetchBOMs();
  }, [fetchBOMs]);

  const handleSelectBOM = (bomId: string) => {
    const target = boms.find((b) => b._id === bomId);
    if (target) {
      setSelectedBOM(target);
      fetchBOMDetail(target._id);
    }
  };

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      setProcessing(true);
      const res = await materialService.createBOM(projectId, {
        notes: newVersionNotes,
      });

      if (res.success && res.data) {
        showSuccess("BOM Created", `BOM Revision v${res.data.bom.version} created as DRAFT.`);
        setIsNewVersionModalOpen(false);
        setNewVersionNotes("");
        fetchBOMs();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to create new BOM version");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedBOM) return;

    try {
      setProcessing(true);
      const res = await materialService.addBOMItem(projectId, selectedBOM._id, {
        materialId: newItemData.materialId,
        plannedQuantity: Number(newItemData.plannedQuantity) || 1,
        unit: newItemData.unit,
        unitCost: Number(newItemData.unitCost) || 0,
        notes: newItemData.notes,
      });

      if (res.success && res.data) {
        showSuccess("Item Added", "Item added to BOM successfully.");
        setIsAddItemModalOpen(false);
        setNewItemData({ materialId: "", plannedQuantity: 1, unit: "", unitCost: 0, notes: "" });
        fetchBOMDetail(selectedBOM._id);
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to add BOM item");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!projectId || !selectedBOM) return;
    if (!confirm("Are you sure you want to remove this item from the BOM?")) return;

    try {
      const res = await materialService.deleteBOMItem(projectId, selectedBOM._id, itemId);
      if (res.success) {
        showSuccess("Item Deleted", "Item deleted from BOM.");
        fetchBOMDetail(selectedBOM._id);
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to delete BOM item");
    }
  };

  const handleApproveBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedBOM) return;

    try {
      setProcessing(true);
      const res = await materialService.approveBOM(projectId, selectedBOM._id, approvalNotes);
      if (res.success) {
        showSuccess("BOM Approved", `BOM Version v${selectedBOM.version} approved successfully!`);
        setIsApproveModalOpen(false);
        setApprovalNotes("");
        fetchBOMs();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to approve BOM");
    } finally {
      setProcessing(false);
    }
  };

  const handleMaterialSelect = (matId: string) => {
    const mat = materials.find((m) => m._id === matId);
    if (mat) {
      setNewItemData({
        ...newItemData,
        materialId: mat._id,
        unit: mat.unit,
        unitCost: mat.unitPrice || 0,
      });
    } else {
      setNewItemData({ ...newItemData, materialId: matId });
    }
  };

  // Cost calculations
  const totalPlannedCost = items.reduce(
    (sum, i) => sum + (i.plannedQuantity || 0) * (i.unitCost || 0),
    0
  );
  const totalUsedCost = items.reduce(
    (sum, i) => sum + (i.usedQuantity || 0) * (i.unitCost || 0),
    0
  );

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
            <span>Bill of Materials</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bill of Materials (BOM)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planned quantities, material variances, unit costing, and version-controlled revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPMOrAdmin && (
            <Button
              id="new-bom-version-btn"
              variant="outline"
              onClick={() => setIsNewVersionModalOpen(true)}
            >
              + New Revision Version
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading Bill of Materials..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBOMs} />
      ) : boms.length === 0 ? (
        <EmptyState
          title="No Bill of Materials (BOM) Created Yet"
          description="Initialize the first BOM version for this project to plan material requirements."
          action={
            isPMOrAdmin ? (
              <Button variant="primary" onClick={() => setIsNewVersionModalOpen(true)}>
                Create Initial BOM
              </Button>
            ) : undefined
          }
        />
      ) : selectedBOM ? (
        <>
          {/* Version Header & Switcher */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Version:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {boms.map((b) => (
                    <button
                      key={b._id}
                      onClick={() => handleSelectBOM(b._id)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                        selectedBOM._id === b._id
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      v{b.version} {b.status === "ACTIVE" && "★"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={selectedBOM.status.toLowerCase()} />
                <StatusBadge status={selectedBOM.approvalStatus.toLowerCase()} />

                {isPMOrAdmin && selectedBOM.approvalStatus !== "APPROVED" && (
                  <>
                    <Button
                      id="add-bom-item-btn"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddItemModalOpen(true)}
                    >
                      + Add Item
                    </Button>
                    <Button
                      id="approve-bom-btn"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsApproveModalOpen(true)}
                    >
                      ✓ Approve BOM
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedBOM.notes && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-200 dark:border-slate-800 font-sans">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Revision Notes:</span> {selectedBOM.notes}
              </div>
            )}
          </Card>

          {/* Cost Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-brand-600">
              <div className="text-xs text-slate-500 font-sans">Total Planned Cost</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                ${totalPlannedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600">
              <div className="text-xs text-slate-500 font-sans">Actual Material Cost</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${totalUsedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-amber-600">
              <div className="text-xs text-slate-500 font-sans">Cost Variance</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                ${(totalPlannedCost - totalUsedCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </div>

          {/* BOM Items Table */}
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-4 text-right">Planned Qty</th>
                    <th className="py-3.5 px-4 text-right">Used Qty</th>
                    <th className="py-3.5 px-4 text-right">Remaining Qty</th>
                    <th className="py-3.5 px-4 text-right">Variance</th>
                    <th className="py-3.5 px-4 text-right">Est. Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Total Est. Cost</th>
                    {selectedBOM.approvalStatus !== "APPROVED" && (
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-500 dark:text-slate-400 font-sans"
                      >
                        No items added to this BOM version yet. Click "+ Add Item" to add materials.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const mat = typeof item.materialId === "object" ? item.materialId : null;
                      const matName = mat ? `${mat.code} - ${mat.name}` : "Material Item";
                      const itemTotal = (item.plannedQuantity || 0) * (item.unitCost || 0);

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                            {matName}
                            {item.notes && (
                              <div className="text-xs text-slate-400 font-normal">{item.notes}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                            {item.plannedQuantity} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300">
                            {item.usedQuantity} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.remainingQuantity} {item.unit}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-semibold ${item.variance < 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                            ${item.unitCost?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                            ${itemTotal.toFixed(2)}
                          </td>
                          {selectedBOM.approvalStatus !== "APPROVED" && (
                            <td className="py-3.5 px-4 text-right font-sans">
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}

      {/* New BOM Revision Modal */}
      <Modal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        title="Create New BOM Revision Version"
      >
        <form onSubmit={handleCreateNewVersion} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A new revision version will be created in DRAFT status. Once approved by a Project Manager, it will supersede the currently active BOM.
          </p>
          <Input
            id="bom-revision-notes"
            label="Revision Notes / Reason"
            placeholder="e.g. Quantity adjustments following Phase 2 structural engineering re-assessment"
            value={newVersionNotes}
            onChange={(e) => setNewVersionNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewVersionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Create Revision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add BOM Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Material Item to BOM"
      >
        <form onSubmit={handleAddItemSubmit} className="space-y-4">
          <Select
            id="bom-material-select"
            label="Select Material *"
            value={newItemData.materialId}
            onChange={(e) => handleMaterialSelect(e.target.value)}
            options={[
              { value: "", label: "-- Choose from Master Catalog --" },
              ...materials.map((m) => ({
                value: m._id,
                label: `${m.code} - ${m.name} (${m.unit})`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="bom-planned-qty"
              label="Planned Quantity *"
              type="number"
              min="0.01"
              step="any"
              value={newItemData.plannedQuantity}
              onChange={(e) => setNewItemData({ ...newItemData, plannedQuantity: Number(e.target.value) })}
              required
            />
            <Input
              id="bom-unit"
              label="Unit"
              value={newItemData.unit}
              onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
              required
            />
          </div>

          <Input
            id="bom-unit-cost"
            label="Estimated Unit Cost ($)"
            type="number"
            min="0"
            step="0.01"
            value={newItemData.unitCost}
            onChange={(e) => setNewItemData({ ...newItemData, unitCost: Number(e.target.value) })}
          />

          <Input
            id="bom-item-notes"
            label="Usage Notes / Milestone Ref"
            placeholder="e.g. Footing reinforcement rebar"
            value={newItemData.notes}
            onChange={(e) => setNewItemData({ ...newItemData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddItemModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Add to BOM
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve BOM Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Approve BOM Revision v${selectedBOM?.version}`}
      >
        <form onSubmit={handleApproveBOM} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Approving this BOM locks planned quantities for site procurement. This revision will become the active baseline for material requests and variance tracking.
          </p>
          <Input
            id="bom-approval-notes"
            label="Approval Notes"
            placeholder="e.g. Reviewed and approved per architectural structural specs."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Confirm Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BOMPage;
