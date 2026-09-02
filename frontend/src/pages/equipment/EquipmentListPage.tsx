import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Wrench,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from "lucide-react";
import { equipmentService, CreateEquipmentPayload } from "../../services/equipmentService.js";
import { procurementService } from "../../services/procurementService.js";
import {
  Equipment,
  EquipmentCategory,
  EquipmentOwnershipType,
} from "../../types/equipment.js";
import { Vendor } from "../../types/procurement.js";
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

const CATEGORY_OPTIONS: Array<{ value: EquipmentCategory; label: string }> = [
  { value: "EARTHMOVING", label: "Earthmoving & Excavation" },
  { value: "CONCRETE", label: "Concrete & Masonry" },
  { value: "MATERIAL_HANDLING", label: "Material Handling & Cranes" },
  { value: "POWER_LIGHTING", label: "Power, Generators & Lighting" },
  { value: "COMPACTION", label: "Compaction & Paving" },
  { value: "PUMPING", label: "Pumping & Dewatering" },
  { value: "SCAFFOLDING", label: "Scaffolding & Access" },
  { value: "TRANSPORT", label: "Vehicles & Transport" },
  { value: "SURVEYING", label: "Surveying & Geotechnical" },
  { value: "OTHER", label: "Other Specialized Machinery" },
];

export const EquipmentListPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Tabs
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOwnership, setSelectedOwnership] = useState("");
  const [statusTab, setStatusTab] = useState<string>("ALL");

  // Create Equipment Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentPayload>({
    code: "",
    name: "",
    category: "EARTHMOVING",
    ownershipType: "OWNED",
    status: "AVAILABLE",
    make: "",
    modelNumber: "",
    serialNumber: "",
    yearOfManufacture: new Date().getFullYear(),
    hourlyRate: 0,
    purchasePrice: 0,
    currentLocation: "Main Equipment Yard",
    rentalDetails: {
      vendorId: "",
      dailyRate: 0,
      monthlyRate: 0,
      rentalStartDate: "",
      rentalEndDate: "",
      contractNumber: "",
    },
    maintenanceSchedule: {
      frequencyMonths: 6,
    },
    notes: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eqRes, vendorRes] = await Promise.all([
        equipmentService.getEquipmentList({
          search: search || undefined,
          category: selectedCategory || undefined,
          ownershipType: selectedOwnership || undefined,
          status: statusTab !== "ALL" ? statusTab : undefined,
          limit: 100,
        }),
        procurementService.getVendors({ status: "ACTIVE" }),
      ]);

      if (eqRes.success && eqRes.data) {
        setEquipmentList(eqRes.data);
      }
      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load equipment catalog");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedOwnership, statusTab]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showError("Validation Error", "Equipment Code and Name are required.");
      return;
    }

    try {
      setCreating(true);
      const payload: CreateEquipmentPayload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        rentalDetails:
          formData.ownershipType === "RENTED" || formData.ownershipType === "LEASED"
            ? {
                ...formData.rentalDetails,
                vendorId: formData.rentalDetails?.vendorId || null,
              }
            : undefined,
      };

      const res = await equipmentService.createEquipment(payload);
      if (res.success && res.data) {
        showSuccess("Equipment Registered", `${res.data.name} (${res.data.code}) added to fleet.`);
        setIsCreateDrawerOpen(false);
        setFormData({
          code: "",
          name: "",
          category: "EARTHMOVING",
          ownershipType: "OWNED",
          status: "AVAILABLE",
          make: "",
          modelNumber: "",
          serialNumber: "",
          yearOfManufacture: new Date().getFullYear(),
          hourlyRate: 0,
          purchasePrice: 0,
          currentLocation: "Main Equipment Yard",
          rentalDetails: { vendorId: "", dailyRate: 0, monthlyRate: 0 },
          maintenanceSchedule: { frequencyMonths: 6 },
          notes: "",
        });
        fetchEquipment();
      }
    } catch (err: unknown) {
      showError("Registration Failed", err instanceof Error ? err.message : "Failed to create equipment");
    } finally {
      setCreating(false);
    }
  };

  const statusCounts = {
    ALL: equipmentList.length,
    AVAILABLE: equipmentList.filter((e) => e.status === "AVAILABLE").length,
    ASSIGNED: equipmentList.filter((e) => e.status === "ASSIGNED" || e.status === "IN_USE").length,
    UNDER_MAINTENANCE: equipmentList.filter((e) => e.status === "UNDER_MAINTENANCE").length,
    BREAKDOWN: equipmentList.filter((e) => e.status === "BREAKDOWN").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Equipment & Asset Fleet Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Machinery catalog, project deployment conflict detection, scheduled maintenance, and breakdown recovery.
          </p>
        </div>

        {canManage && (
          <Button
            id="register-equipment-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + Register Equipment
          </Button>
        )}
      </div>

      {/* Status Grouping Tabs (per UI_UX.md Section 20) */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-card overflow-x-auto">
        {[
          { id: "ALL", label: "All Fleet", count: statusCounts.ALL, icon: <Layers className="w-3.5 h-3.5" /> },
          { id: "AVAILABLE", label: "Available", count: statusCounts.AVAILABLE, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
          { id: "ASSIGNED", label: "Assigned / In Use", count: statusCounts.ASSIGNED, icon: <Clock className="w-3.5 h-3.5 text-brand-500" /> },
          { id: "UNDER_MAINTENANCE", label: "Under Maintenance", count: statusCounts.UNDER_MAINTENANCE, icon: <Wrench className="w-3.5 h-3.5 text-amber-500" /> },
          { id: "BREAKDOWN", label: "Breakdown", count: statusCounts.BREAKDOWN, icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> },
        ].map((tab) => {
          const isActive = statusTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? "bg-brand-600 text-white shadow-xs font-display"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              id="equipment-search-input"
              placeholder="Search by equipment code, name, make..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            id="equipment-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: "", label: "All Equipment Categories" },
              ...CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />

          <Select
            id="equipment-ownership-filter"
            value={selectedOwnership}
            onChange={(e) => setSelectedOwnership(e.target.value)}
            options={[
              { value: "", label: "All Ownership Types" },
              { value: "OWNED", label: "Company Owned" },
              { value: "RENTED", label: "Rented Machine" },
              { value: "LEASED", label: "Leased Asset" },
            ]}
          />
        </div>
      </Card>

      {/* Equipment Fleet Table */}
      {loading ? (
        <LoadingState message="Loading equipment fleet..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEquipment} />
      ) : equipmentList.length === 0 ? (
        <EmptyState
          title="No Equipment Units Found"
          description="No machinery or asset records match your selected filter criteria."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                Register First Equipment
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
                  <th className="py-3.5 px-4">Equipment Spec</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Ownership</th>
                  <th className="py-3.5 px-4">Current Yard / Site</th>
                  <th className="py-3.5 px-4 text-right">Rates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {equipmentList.map((eq) => (
                  <tr key={eq._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <Link
                        to={`/equipment/${eq._id}`}
                        className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0 font-display">
                          {eq.code.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {eq.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {eq.code} {eq.make ? `• ${eq.make} ${eq.modelNumber || ""}` : ""}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-sans font-medium text-zinc-700 dark:text-zinc-300">
                      {eq.category.replace(/_/g, " ")}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                        {eq.ownershipType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-400">
                      {eq.currentLocation || "Yard"}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {eq.hourlyRate && eq.hourlyRate > 0 ? (
                        <span>₹{eq.hourlyRate}/hr</span>
                      ) : eq.rentalDetails?.dailyRate && eq.rentalDetails.dailyRate > 0 ? (
                        <span>₹{eq.rentalDetails.dailyRate}/day</span>
                      ) : (
                        <span className="text-zinc-400 font-normal">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <StatusBadge status={eq.status.toLowerCase()} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <Link
                        to={`/equipment/${eq._id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Register Equipment SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Register Equipment / Asset"
        subtitle="Add a new machinery unit to the master equipment fleet"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="equipment-code-input"
              label="Equipment Code / Asset Tag *"
              placeholder="e.g. EQ-EXC-002"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />

            <Input
              id="equipment-name-input"
              label="Equipment Name *"
              placeholder="e.g. CAT 320 Hydraulic Excavator"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="equipment-category-select"
              label="Machinery Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
              options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
              required
            />

            <Select
              id="equipment-ownership-select"
              label="Ownership Classification *"
              value={formData.ownershipType}
              onChange={(e) =>
                setFormData({ ...formData, ownershipType: e.target.value as EquipmentOwnershipType })
              }
              options={[
                { value: "OWNED", label: "Company Owned Machine" },
                { value: "RENTED", label: "Rented from Vendor / Agency" },
                { value: "LEASED", label: "Long-term Leased Asset" },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="equipment-make-input"
              label="Make / Manufacturer"
              placeholder="e.g. Caterpillar"
              value={formData.make || ""}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            />

            <Input
              id="equipment-model-input"
              label="Model Number"
              placeholder="e.g. 320D"
              value={formData.modelNumber || ""}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
            />

            <Input
              id="equipment-serial-input"
              label="Serial Number / VIN"
              placeholder="e.g. CAT0320D88910"
              value={formData.serialNumber || ""}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
          </div>

          {(formData.ownershipType === "RENTED" || formData.ownershipType === "LEASED") && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/70 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-display block">
                Rental / Supplier Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  id="equipment-vendor-select"
                  label="Rental Vendor / Agency"
                  value={formData.rentalDetails?.vendorId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rentalDetails: {
                        ...formData.rentalDetails,
                        vendorId: e.target.value || null,
                      },
                    })
                  }
                  options={[
                    { value: "", label: "-- Select Rental Vendor --" },
                    ...vendors.map((v) => ({ value: v._id, label: `${v.name} (${v.code})` })),
                  ]}
                />

                <Input
                  id="equipment-daily-rate"
                  label="Daily Rental Rate (₹)"
                  type="number"
                  min="0"
                  value={formData.rentalDetails?.dailyRate || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rentalDetails: {
                        ...formData.rentalDetails,
                        dailyRate: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="equipment-hourly-rate"
              label="Operational Cost (₹ / hour)"
              type="number"
              min="0"
              value={formData.hourlyRate || 0}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
            />

            <Input
              id="equipment-location-input"
              label="Initial Location / Depot"
              placeholder="e.g. Central Yard, Sector 4"
              value={formData.currentLocation || ""}
              onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
            />
          </div>

          <Input
            id="equipment-notes-input"
            label="Technical Specifications & Notes"
            placeholder="e.g. Operating weight 21,500 kg, bucket capacity 1.19 m³"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Register Equipment
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default EquipmentListPage;
