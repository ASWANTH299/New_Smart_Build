import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import { workforceService, CreateWorkerPayload } from "../../services/workforceService.js";
import { procurementService } from "../../services/procurementService.js";
import { Worker, WorkerTrade, WorkerType, WorkerStatus } from "../../types/workforce.js";
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

const TRADE_OPTIONS: Array<{ value: WorkerTrade; label: string }> = [
  { value: "MASON", label: "Mason" },
  { value: "CARPENTER", label: "Carpenter" },
  { value: "ELECTRICIAN", label: "Electrician" },
  { value: "PLUMBER", label: "Plumber" },
  { value: "PAINTER", label: "Painter" },
  { value: "STEEL_FIXER", label: "Steel Fixer / Rebar" },
  { value: "WELDER", label: "Welder / Fabricator" },
  { value: "HEAVY_OPERATOR", label: "Heavy Equipment Operator" },
  { value: "GENERAL_LABOR", label: "General Site Labor" },
  { value: "SURVEYOR", label: "Site Surveyor" },
  { value: "FOREMAN", label: "Foreman / Chargehand" },
  { value: "OTHER", label: "Other Specialized Trade" },
];

export const WorkerListPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Create Worker Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateWorkerPayload>({
    name: "",
    trade: "MASON",
    workerType: "DIRECT",
    contractorId: "",
    contact: {
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
    },
    status: "ACTIVE",
    notes: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [workerRes, vendorRes] = await Promise.all([
        workforceService.getWorkers({
          search: search || undefined,
          trade: selectedTrade || undefined,
          workerType: selectedType || undefined,
          status: selectedStatus || undefined,
          limit: 50,
        }),
        procurementService.getVendors({ status: "ACTIVE" }),
      ]);

      if (workerRes.success && workerRes.data) {
        setWorkers(workerRes.data);
      }
      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load workforce directory");
    } finally {
      setLoading(false);
    }
  }, [search, selectedTrade, selectedType, selectedStatus]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Validation Error", "Worker name is required.");
      return;
    }

    try {
      setCreating(true);
      const res = await workforceService.createWorker({
        ...formData,
        name: formData.name.trim(),
        contractorId:
          formData.workerType === "CONTRACTOR" || formData.workerType === "SUBCONTRACTOR"
            ? formData.contractorId || null
            : null,
      });

      if (res.success && res.data) {
        showSuccess("Worker Registered", `${res.data.name} added to workforce roster.`);
        setIsCreateDrawerOpen(false);
        setFormData({
          name: "",
          trade: "MASON",
          workerType: "DIRECT",
          contractorId: "",
          contact: { phone: "", email: "", address: "", emergencyContact: "" },
          status: "ACTIVE",
          notes: "",
        });
        fetchWorkers();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to register worker");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Workforce & Labor Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Site worker records, specialized trade rosters, contractor staffing, and assignment history.
          </p>
        </div>

        {canManage && (
          <Button
            id="create-worker-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + Register Worker
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              id="worker-search-input"
              placeholder="Search by worker name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            id="trade-filter-select"
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            options={[
              { value: "", label: "All Specialized Trades" },
              ...TRADE_OPTIONS.map((t) => ({ value: t.value, label: t.label })),
            ]}
          />

          <Select
            id="worker-type-filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: "", label: "All Staffing Types" },
              { value: "DIRECT", label: "Direct Employee" },
              { value: "CONTRACTOR", label: "Contractor Staff" },
              { value: "SUBCONTRACTOR", label: "Subcontractor Staff" },
              { value: "TEMPORARY", label: "Temporary Labor" },
            ]}
          />

          <Select
            id="worker-status-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "ON_LEAVE", label: "On Leave" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "TERMINATED", label: "Terminated" },
            ]}
          />
        </div>
      </Card>

      {/* Workers Roster Table */}
      {loading ? (
        <LoadingState message="Loading workforce roster..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWorkers} />
      ) : workers.length === 0 ? (
        <EmptyState
          title="No Workers Found"
          description="No worker master records match your search or filter criteria."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                Register First Worker
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
                  <th className="py-3.5 px-4">Worker Name</th>
                  <th className="py-3.5 px-4">Trade / Specialization</th>
                  <th className="py-3.5 px-4">Staffing Type</th>
                  <th className="py-3.5 px-4">Contractor / Agency</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {workers.map((worker) => {
                  const contractorName =
                    typeof worker.contractorId === "object" && worker.contractorId
                      ? worker.contractorId.name
                      : "—";

                  return (
                    <tr key={worker._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-zinc-900 dark:text-zinc-100">
                        <Link
                          to={`/workforce/${worker._id}`}
                          className="hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs font-display">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{worker.name}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {worker.trade.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                          {worker.workerType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-300">
                        {contractorName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500">
                        {worker.contact?.phone || worker.contact?.email || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={worker.status.toLowerCase()} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Link
                          to={`/workforce/${worker._id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-0.5"
                        >
                          Profile <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Register Worker SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Register Worker Master Record"
        subtitle="Add a new trade worker or contractor labor to the workforce catalog"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            id="worker-name-input"
            label="Worker Full Name *"
            placeholder="e.g. Ramesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="worker-trade-select"
              label="Specialized Trade *"
              value={formData.trade}
              onChange={(e) => setFormData({ ...formData, trade: e.target.value as WorkerTrade })}
              options={TRADE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
              required
            />

            <Select
              id="worker-type-select"
              label="Staffing / Employment Type *"
              value={formData.workerType}
              onChange={(e) => setFormData({ ...formData, workerType: e.target.value as WorkerType })}
              options={[
                { value: "DIRECT", label: "Direct Company Employee" },
                { value: "CONTRACTOR", label: "Contractor Workforce" },
                { value: "SUBCONTRACTOR", label: "Subcontractor Workforce" },
                { value: "TEMPORARY", label: "Temporary Daily Labor" },
              ]}
              required
            />
          </div>

          {(formData.workerType === "CONTRACTOR" || formData.workerType === "SUBCONTRACTOR") && (
            <Select
              id="worker-contractor-select"
              label="Associated Contractor / Vendor Agency"
              value={formData.contractorId || ""}
              onChange={(e) => setFormData({ ...formData, contractorId: e.target.value || null })}
              options={[
                { value: "", label: "-- Select Contractor Agency --" },
                ...vendors.map((v) => ({ value: v._id, label: `${v.name} (${v.code})` })),
              ]}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="worker-phone-input"
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.contact?.phone || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value },
                })
              }
            />

            <Input
              id="worker-email-input"
              label="Email Address"
              type="email"
              placeholder="worker@example.com"
              value={formData.contact?.email || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: e.target.value },
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="worker-emergency-input"
              label="Emergency Contact"
              placeholder="Name & Emergency Phone"
              value={formData.contact?.emergencyContact || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, emergencyContact: e.target.value },
                })
              }
            />

            <Select
              id="worker-status-select"
              label="Initial Status"
              value={formData.status || "ACTIVE"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkerStatus })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "ON_LEAVE", label: "On Leave" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>

          <Input
            id="worker-notes-input"
            label="Notes / Certifications"
            placeholder="e.g. Certified High-Voltage Electrician (License #4482)"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Register Worker
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default WorkerListPage;
