import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Check, Trash2, Layers, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { materialService } from "../../services/materialService.js";
import { BOM, BOMItem, Material } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import Select from "../../components/ui/Select.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import Modal from "../../components/ui/Modal.js";
import SlideOverDrawer from "../../components/ui/SlideOverDrawer.js";
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

  // Drawers & Modals
  const [isNewVersionDrawerOpen, setIsNewVersionDrawerOpen] = useState(false);
  const [isAddItemDrawerOpen, setIsAddItemDrawerOpen] = useState(false);
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
        setIsNewVersionDrawerOpen(false);
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
        setIsAddItemDrawerOpen(false);
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
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link to={`/projects/${projectId}`} className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Project Workspace
            </Link>
            <span>/</span>
            <span>Bill of Materials</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Bill of Materials (BOM)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Planned quantities, material variances, unit costing, and version-controlled revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPMOrAdmin && (
            <Button
              id="new-bom-version-btn"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsNewVersionDrawerOpen(true)}
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
              <Button variant="primary" onClick={() => setIsNewVersionDrawerOpen(true)}>
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
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-display">
                  Revision:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {boms.map((b) => (
                    <button
                      key={b._id}
                      onClick={() => handleSelectBOM(b._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                        selectedBOM._id === b._id
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      v{b.version} {b.status === "ACTIVE" && "★"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <StatusBadge status={selectedBOM.status.toLowerCase()} />
                <StatusBadge status={selectedBOM.approvalStatus.toLowerCase()} />

                {isPMOrAdmin && selectedBOM.approvalStatus !== "APPROVED" && (
                  <>
                    <Button
                      id="add-bom-item-btn"
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setIsAddItemDrawerOpen(true)}
                    >
                      + Add Item
                    </Button>
                    <Button
                      id="approve-bom-btn"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => setIsApproveModalOpen(true)}
                    >
                      ✓ Approve BOM
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedBOM.notes && (
              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-850 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 font-sans">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-display">
                  Revision Notes:
                </span>{" "}
                {selectedBOM.notes}
              </div>
            )}
          </Card>

          {/* Cost Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Total Planned Cost</span>
                <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
                ${totalPlannedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Actual Material Cost</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-display tabular-nums font-mono">
                ${totalUsedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
              <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
                <span>Cost Variance</span>
                <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
                ${(totalPlannedCost - totalUsedCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* BOM Items Table */}
          <Card className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800 font-display">
                  <tr>
                    <th className="py-3.5 px-4">Material Spec</th>
                    <th className="py-3.5 px-4 text-right">Planned Qty</th>
                    <th className="py-3.5 px-4 text-right">Used Qty</th>
                    <th className="py-3.5 px-4 text-right">Remaining Qty</th>
                    <th className="py-3.5 px-4 text-right">Variance</th>
                    <th className="py-3.5 px-4 text-right">Est. Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Total Cost</th>
                    {selectedBOM.approvalStatus !== "APPROVED" && (
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-sans"
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
                        <tr key={item._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                            {matName}
                            {item.notes && (
                              <div className="text-xs text-zinc-400 font-normal mt-0.5">{item.notes}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.plannedQuantity} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right text-zinc-600 dark:text-zinc-300">
                            {item.usedQuantity} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.remainingQuantity} {item.unit}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-semibold ${item.variance < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </td>
                          <td className="py-3.5 px-4 text-right text-zinc-700 dark:text-zinc-300">
                            ${item.unitCost?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                            ${itemTotal.toFixed(2)}
                          </td>
                          {selectedBOM.approvalStatus !== "APPROVED" && (
                            <td className="py-3.5 px-4 text-right font-sans">
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold p-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* New BOM Revision SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isNewVersionDrawerOpen}
        onClose={() => setIsNewVersionDrawerOpen(false)}
        title="Create New BOM Revision"
        subtitle="Initialize a new draft version for engineering quantity re-assessments"
      >
        <form onSubmit={handleCreateNewVersion} className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            A new revision version will be created in DRAFT status. Once approved by a Project Manager, it will supersede the currently active baseline BOM.
          </p>
          <Input
            id="bom-revision-notes"
            label="Revision Notes / Reason *"
            placeholder="e.g. Quantity adjustments following Phase 2 structural engineering re-assessment"
            value={newVersionNotes}
            onChange={(e) => setNewVersionNotes(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsNewVersionDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Create Revision
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Add BOM Item SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isAddItemDrawerOpen}
        onClose={() => setIsAddItemDrawerOpen(false)}
        title="Add Material Item to BOM"
        subtitle={`Planning material requirements for Revision v${selectedBOM?.version}`}
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
            placeholder="e.g. Level 2 slab reinforcement rebar"
            value={newItemData.notes}
            onChange={(e) => setNewItemData({ ...newItemData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsAddItemDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processing}>
              Add to BOM
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Approve BOM Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Approve BOM Revision v${selectedBOM?.version}`}
      >
        <form onSubmit={handleApproveBOM} className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Approving this BOM locks planned quantities for site procurement. This revision will become the active baseline for material requests and variance tracking.
          </p>
          <Input
            id="bom-approval-notes"
            label="Approval Notes"
            placeholder="e.g. Reviewed and approved per architectural structural specs."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
