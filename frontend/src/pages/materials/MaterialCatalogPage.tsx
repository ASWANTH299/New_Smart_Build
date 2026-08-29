import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { materialService } from "../../services/materialService.js";
import { Material } from "../../types/material.js";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Create Modal
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

  const canManageMaterials =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [matRes, catRes] = await Promise.all([
        materialService.getMaterials({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined,
        }),
        materialService.getCategories(),
      ]);

      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Materials Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard construction materials master data, technical specs, and stock thresholds.
          </p>
        </div>
        {canManageMaterials && (
          <Button
            id="add-material-btn"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Add Material
          </Button>
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
        <LoadingState message="Loading materials catalog..." />
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
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">Min / Reorder</th>
                  <th className="py-3.5 px-4">Est. Unit Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {materials.map((mat) => (
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
                    <td className="py-3.5 px-4 font-sans text-slate-500 dark:text-slate-400">
                      {mat.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {mat.minimumStock} / {mat.reorderLevel}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white">
                      ${mat.unitPrice ? mat.unitPrice.toFixed(2) : "0.00"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={mat.status.toLowerCase()} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <Link
                        to={`/materials/${mat._id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
              label="Standard Unit *"
              placeholder="e.g. Bags, Tons, Pieces, m³"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="new-material-min-stock"
              label="Min Stock Alert"
              type="number"
              min="0"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
            />
            <Input
              id="new-material-reorder-level"
              label="Reorder Level"
              type="number"
              min="0"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
            />
            <Input
              id="new-material-unit-price"
              label="Est. Unit Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
            />
          </div>

          <Input
            id="new-material-specs"
            label="Technical Specifications"
            placeholder="e.g. ASTM C150 Type I standard, 50kg bag"
            value={formData.specifications}
            onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={creating}
            >
              Save Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaterialCatalogPage;
