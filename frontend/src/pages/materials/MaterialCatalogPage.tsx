import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Package, AlertTriangle } from "lucide-react";
import { materialService } from "../../services/materialService.js";
import { Material, InventoryLocation } from "../../types/material.js";
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

export const MaterialCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, { total: number; available: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Create Material Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    unit: "",
    specifications: "",
    minimumStock: 10,
    reorderLevel: 25,
    unitPrice: 0,
    notes: "",
  });

  // Quick Inward (Receive) Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedMaterialForReceive, setSelectedMaterialForReceive] = useState<Material | null>(null);
  const [receiveLocationId, setReceiveLocationId] = useState("");
  const [receiveQuantity, setReceiveQuantity] = useState(10);
  const [receiveUnitCost, setReceiveUnitCost] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);

  // Quick Issue Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedMaterialForIssue, setSelectedMaterialForIssue] = useState<Material | null>(null);
  const [issueLocationId, setIssueLocationId] = useState("");
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueReason, setIssueReason] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);

  const canManageMaterials =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [matRes, catRes, balRes, locRes] = await Promise.all([
        materialService.getMaterials({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined,
        }),
        materialService.getCategories(),
        materialService.getBalances({ limit: 1000 }),
        materialService.getLocations(),
      ]);

      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (locRes.success && locRes.data) {
        const locList = locRes.data;
        setLocations(locList);
        if (locList.length > 0) {
          setReceiveLocationId((prev) => prev || locList[0]._id);
          setIssueLocationId((prev) => prev || locList[0]._id);
        }
      }
      if (balRes.success && balRes.data) {
        const map: Record<string, { total: number; available: number }> = {};
        balRes.data.forEach((b) => {
          const mId = typeof b.materialId === "object" && b.materialId ? b.materialId._id : String(b.materialId);
          if (mId) {
            const curr = map[mId] || { total: 0, available: 0 };
            curr.total += b.quantity || 0;
            curr.available += b.availableQuantity || 0;
            map[mId] = curr;
          }
        });
        setStockMap(map);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load materials catalog");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.category || !formData.unit) {
      showError("Validation Error", "Please fill in all required fields (Code, Name, Category, Unit).");
      return;
    }

    try {
      setCreating(true);
      const res = await materialService.createMaterial({
        ...formData,
        code: formData.code.toUpperCase(),
        minimumStock: Number(formData.minimumStock) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
      });

      if (res.success) {
        showSuccess("Material Created", "Material added to catalog successfully.");
        setIsCreateModalOpen(false);
        setFormData({
          code: "",
          name: "",
          category: "",
          unit: "",
          specifications: "",
          minimumStock: 10,
          reorderLevel: 25,
          unitPrice: 0,
          notes: "",
        });
        fetchMaterials();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to create material");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenReceive = (mat: Material) => {
    setSelectedMaterialForReceive(mat);
    setReceiveQuantity(mat.reorderLevel || 10);
    setReceiveUnitCost(mat.unitPrice || 0);
    setIsReceiveModalOpen(true);
  };

  const handleOpenIssue = (mat: Material) => {
    setSelectedMaterialForIssue(mat);
    setIssueQuantity(1);
    setIssueReason("");
    setIsIssueModalOpen(true);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForReceive || !receiveLocationId || receiveQuantity <= 0) {
      showError("Validation Error", "Please specify a valid storage location and quantity.");
      return;
    }

    setIsReceiving(true);
    try {
      const res = await materialService.receiveMaterials({
        locationId: receiveLocationId,
        materialId: selectedMaterialForReceive._id,
        quantity: Number(receiveQuantity),
        unitCost: Number(receiveUnitCost) || 0,
        reason: "Catalog stock inward receipt",
      });

      if (res.success) {
        showSuccess(
          "Stock Received",
          `Added ${receiveQuantity} ${selectedMaterialForReceive.unit} of ${selectedMaterialForReceive.name} to inventory.`
        );
        setIsReceiveModalOpen(false);
        fetchMaterials();
      }
    } catch (err: unknown) {
      showError("Receipt Failed", err instanceof Error ? err.message : "Error receiving stock.");
    } finally {
      setIsReceiving(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForIssue || !issueLocationId || issueQuantity <= 0) {
      showError("Validation Error", "Please specify a valid storage location and quantity.");
      return;
    }

    setIsIssuing(true);
    try {
      const res = await materialService.issueMaterials({
        locationId: issueLocationId,
        materialId: selectedMaterialForIssue._id,
        quantity: Number(issueQuantity),
        reason: issueReason.trim() || "Stock issuance / consumption from catalog",
      });

      if (res.success) {
        showSuccess(
          "Stock Issued",
          `Issued ${issueQuantity} ${selectedMaterialForIssue.unit} of ${selectedMaterialForIssue.name}.`
        );
        setIsIssueModalOpen(false);
        fetchMaterials();
      }
    } catch (err: unknown) {
      showError("Issue Failed", err instanceof Error ? err.message : "Error issuing stock.");
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Materials Catalog & Inventory Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard construction materials master data, UOM, real-time stock levels, and safe minimum thresholds.
          </p>
        </div>
        {canManageMaterials && (
          <div className="flex items-center gap-2">
            <Link to="/inventory">
              <Button variant="outline">Open Warehouse View</Button>
            </Link>
            <Button
              id="add-material-btn"
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Add Material
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="material-search-input"
            placeholder="Search by code, name, specs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            id="material-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />

          <Select
            id="material-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "DISCONTINUED", label: "Discontinued" },
            ]}
          />
        </div>
      </Card>

      {/* Content Area */}
      {loading ? (
        <LoadingState message="Loading materials catalog and stock levels..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMaterials} />
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials found"
          description="Try adjusting your search criteria or add new materials to the master catalog."
          action={
            canManageMaterials ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Add First Material
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
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Material Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit (UOM)</th>
                  <th className="py-3.5 px-4 text-right">Available Stock</th>
                  <th className="py-3.5 px-4 text-right">Safe Min / Reorder</th>
                  <th className="py-3.5 px-4 text-right">Est. Unit Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Stock Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {materials.map((mat) => {
                  const stock = stockMap[mat._id] || { total: 0, available: 0 };
                  const isLow = mat.minimumStock > 0 && stock.available <= mat.minimumStock;
                  const isReorder = mat.reorderLevel > 0 && stock.available <= mat.reorderLevel;

                  return (
                    <tr key={mat._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                        {mat.code}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        <Link to={`/materials/${mat._id}`} className="hover:underline">
                          {mat.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {mat.category}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-700 dark:text-slate-300 font-semibold">
                        {mat.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              {stock.available} {mat.unit}
                            </span>
                          ) : isReorder ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              {stock.available} {mat.unit}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {stock.available} {mat.unit}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                        {mat.minimumStock} / {mat.reorderLevel} {mat.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-900 dark:text-white">
                        ${mat.unitPrice ? mat.unitPrice.toFixed(2) : "0.00"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={mat.status.toLowerCase()} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageMaterials && (
                            <>
                              <button
                                type="button"
                                title="Inward Receipt"
                                onClick={() => handleOpenReceive(mat)}
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-0.5"
                              >
                                <ArrowDownLeft className="w-3 h-3" /> Inward
                              </button>
                              <button
                                type="button"
                                title="Issue / Consume"
                                onClick={() => handleOpenIssue(mat)}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded border border-blue-200 dark:border-blue-800 text-[11px] font-semibold inline-flex items-center gap-0.5"
                              >
                                <ArrowUpRight className="w-3 h-3" /> Issue
                              </button>
                            </>
                          )}
                          <Link
                            to={`/materials/${mat._id}`}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 ml-1"
                          >
                            Details →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Inward Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={selectedMaterialForReceive ? `Stock Inward: ${selectedMaterialForReceive.name}` : "Receive Stock"}
        description="Receive purchased or delivered construction materials into a storage location."
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
              label={`Quantity to Inward (${selectedMaterialForReceive?.unit || "units"}) *`}
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
            <Button
              variant="primary"
              type="submit"
              isLoading={isReceiving}
              leftIcon={<ArrowDownLeft className="w-4 h-4" />}
            >
              Confirm Inward Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Issue Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title={selectedMaterialForIssue ? `Issue Stock: ${selectedMaterialForIssue.name}` : "Issue Stock"}
        description="Issue materials from a store for project work execution or contractor requisition."
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <Select
            label="Source Storage Location *"
            options={locations.map((loc) => ({
              value: loc._id,
              label: `${loc.name} (${loc.type === "CENTRAL_WAREHOUSE" ? "Central Warehouse" : "Site Store"})`,
            }))}
            value={issueLocationId}
            onChange={(e) => setIssueLocationId(e.target.value)}
            required
          />

          <Input
            label={`Quantity to Issue (${selectedMaterialForIssue?.unit || "units"}) *`}
            type="number"
            min={0.01}
            step="any"
            value={issueQuantity}
            onChange={(e) => setIssueQuantity(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Requisition / Issuance Reason *"
            placeholder="e.g. Requisition for Level 2 slab reinforcement"
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isIssuing}
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Confirm Stock Issuance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Material Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Material to Catalog"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="new-material-code"
              label="Material Code *"
              placeholder="e.g. MAT-CON-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              id="new-material-name"
              label="Material Name *"
              placeholder="e.g. Portland Cement Type I"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="new-material-category"
              label="Category *"
              placeholder="e.g. Cement & Aggregates"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <Input
              id="new-material-unit"
              label="Standard Unit (UOM) *"
              placeholder="e.g. Bags, Tons, Pieces, m³"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="new-material-min-stock"
              label="Min Safe Stock"
              type="number"
              min={0}
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
            />
            <Input
              id="new-material-reorder"
              label="Reorder Threshold"
              type="number"
              min={0}
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
            />
            <Input
              id="new-material-price"
              label="Est. Unit Price ($)"
              type="number"
              min={0}
              step="any"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Input
            id="new-material-specs"
            label="Technical Specifications"
            placeholder="Grade, standard compliance, packaging..."
            value={formData.specifications}
            onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={creating}
              leftIcon={<Package className="w-4 h-4" />}
            >
              Add Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialCatalogPage;
