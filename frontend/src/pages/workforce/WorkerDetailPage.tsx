import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  FolderKanban,
  Edit2,
} from "lucide-react";
import { workforceService, CreateWorkerPayload } from "../../services/workforceService.js";
import { procurementService } from "../../services/procurementService.js";
import { Worker, WorkforceAssignment, WorkerTrade, WorkerType, WorkerStatus } from "../../types/workforce.js";
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
import ErrorState from "../../components/ui/ErrorState.js";

export const WorkerDetailPage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<WorkforceAssignment[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<WorkforceAssignment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Drawer
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<CreateWorkerPayload>({
    name: "",
    trade: "MASON",
    workerType: "DIRECT",
    contractorId: "",
    contact: { phone: "", email: "", address: "", emergencyContact: "" },
    status: "ACTIVE",
    notes: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchWorkerDetail = useCallback(async () => {
    if (!workerId) return;
    try {
      setLoading(true);
      setError(null);
      const [res, vendorRes] = await Promise.all([
        workforceService.getWorkerById(workerId),
        procurementService.getVendors({ status: "ACTIVE" }),
      ]);

      if (res.success && res.data) {
        setWorker(res.data.worker);
        setActiveAssignments(res.data.activeAssignments || []);
        setAssignmentHistory(res.data.assignmentHistory || []);

        const w = res.data.worker;
        setEditFormData({
          name: w.name,
          trade: w.trade,
          workerType: w.workerType,
          contractorId: typeof w.contractorId === "object" && w.contractorId ? w.contractorId._id : "",
          contact: {
            phone: w.contact?.phone || "",
            email: w.contact?.email || "",
            address: w.contact?.address || "",
            emergencyContact: w.contact?.emergencyContact || "",
          },
          status: w.status,
          notes: w.notes || "",
        });
      }
      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load worker profile");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerDetail();
  }, [fetchWorkerDetail]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;

    try {
      setUpdating(true);
      const res = await workforceService.updateWorker(workerId, {
        ...editFormData,
        contractorId:
          editFormData.workerType === "CONTRACTOR" || editFormData.workerType === "SUBCONTRACTOR"
            ? editFormData.contractorId || null
            : null,
      });

      if (res.success && res.data) {
        showSuccess("Worker Updated", "Worker profile details updated successfully.");
        setIsEditDrawerOpen(false);
        fetchWorkerDetail();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to update worker");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading worker profile..." />;
  if (error || !worker) return <ErrorState message={error || "Worker not found"} onRetry={fetchWorkerDetail} />;

  const contractorName =
    typeof worker.contractorId === "object" && worker.contractorId
      ? worker.contractorId.name
      : null;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans">
        <Link
          to="/workforce"
          className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Workforce Catalog
        </Link>
        <span>/</span>
        <span>{worker.name}</span>
      </div>

      {/* Hero Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-extrabold text-2xl font-display shadow-sm shadow-brand-500/20">
            {worker.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                {worker.name}
              </h1>
              <StatusBadge status={worker.status.toLowerCase()} size="md" />
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap font-sans">
              <span className="font-semibold text-brand-600 dark:text-brand-400 font-display">
                {worker.trade.replace(/_/g, " ")}
              </span>
              <span>•</span>
              <span className="font-mono">{worker.workerType}</span>
              {contractorName && (
                <>
                  <span>•</span>
                  <span>Contractor: {contractorName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <Button
            id="edit-worker-btn"
            variant="outline"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={() => setIsEditDrawerOpen(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Grid: Contact & Profile Details / Active Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <Card title="Worker Information">
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-sans">Specialized Trade</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-display text-sm">
                  {worker.trade.replace(/_/g, " ")}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-sans">Staffing Classification</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                  {worker.workerType}
                </span>
              </div>

              {contractorName && (
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-sans">Contractor Agency</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans">
                    {contractorName}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] font-bold uppercase tracking-wider font-display">
                  Contact Details
                </span>
                {worker.contact?.phone && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{worker.contact.phone}</span>
                  </div>
                )}
                {worker.contact?.email && (
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-mono">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{worker.contact.email}</span>
                  </div>
                )}
                {worker.contact?.emergencyContact && (
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="text-[10px] text-zinc-400 block">Emergency Contact:</span>
                    <span className="font-medium font-sans">{worker.contact.emergencyContact}</span>
                  </div>
                )}
                {!worker.contact?.phone && !worker.contact?.email && !worker.contact?.emergencyContact && (
                  <p className="text-zinc-400 italic">No contact information on record.</p>
                )}
              </div>

              {worker.notes && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] font-bold uppercase tracking-wider font-display">
                    Notes / Certifications
                  </span>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                    {worker.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Assignments Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <Card
            title={`Active Project Assignments (${activeAssignments.length})`}
            subtitle="Currently assigned construction projects, phases, and tasks"
          >
            {activeAssignments.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic py-4 text-center">
                Worker is not currently assigned to any active project tasks.
              </p>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((a) => {
                  const proj = typeof a.projectId === "object" ? a.projectId : null;
                  const phase = typeof a.phaseId === "object" ? a.phaseId : null;
                  const task = typeof a.taskId === "object" ? a.taskId : null;

                  return (
                    <div
                      key={a._id}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                          <Link
                            to={`/projects/${proj?._id}`}
                            className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline font-display text-sm"
                          >
                            {proj ? `${proj.name} (${proj.code})` : "Project"}
                          </Link>
                        </div>

                        {(phase || task) && (
                          <div className="text-zinc-500 dark:text-zinc-400 pl-6 space-x-2">
                            {phase && <span>Phase: {phase.name}</span>}
                            {task && <span>• Task: {task.title}</span>}
                          </div>
                        )}

                        <div className="text-[11px] text-zinc-400 pl-6 font-mono">
                          Assigned: {new Date(a.startDate).toLocaleDateString()}
                          {a.endDate ? ` → ${new Date(a.endDate).toLocaleDateString()}` : " (Ongoing)"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center pl-6 sm:pl-0">
                        <StatusBadge status={a.status.toLowerCase()} size="sm" />
                        {proj && (
                          <Link to={`/projects/${proj._id}/attendance`}>
                            <Button variant="outline" size="sm">
                              Attendance
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Historical Assignments */}
          <Card
            title={`Assignment History (${assignmentHistory.length})`}
            subtitle="Previous project engagements and completed assignments"
          >
            {assignmentHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">
                No historical assignments logged yet.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {assignmentHistory.map((a) => {
                  const proj = typeof a.projectId === "object" ? a.projectId : null;

                  return (
                    <div key={a._id} className="py-3 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans block">
                          {proj ? proj.name : "Project"}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(a.startDate).toLocaleDateString()} -{" "}
                          {a.endDate ? new Date(a.endDate).toLocaleDateString() : "Concluded"}
                        </span>
                      </div>
                      <StatusBadge status={a.status.toLowerCase()} size="sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Worker SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title="Edit Worker Profile"
        subtitle={`Update master record details for ${worker.name}`}
        size="lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <Input
            id="edit-worker-name"
            label="Worker Full Name *"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="edit-worker-trade"
              label="Specialized Trade *"
              value={editFormData.trade}
              onChange={(e) => setEditFormData({ ...editFormData, trade: e.target.value as WorkerTrade })}
              options={[
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
              ]}
              required
            />

            <Select
              id="edit-worker-type"
              label="Staffing Type *"
              value={editFormData.workerType}
              onChange={(e) => setEditFormData({ ...editFormData, workerType: e.target.value as WorkerType })}
              options={[
                { value: "DIRECT", label: "Direct Employee" },
                { value: "CONTRACTOR", label: "Contractor Workforce" },
                { value: "SUBCONTRACTOR", label: "Subcontractor Workforce" },
                { value: "TEMPORARY", label: "Temporary Daily Labor" },
              ]}
              required
            />
          </div>

          {(editFormData.workerType === "CONTRACTOR" || editFormData.workerType === "SUBCONTRACTOR") && (
            <Select
              id="edit-worker-contractor"
              label="Contractor / Supplier Agency"
              value={editFormData.contractorId || ""}
              onChange={(e) => setEditFormData({ ...editFormData, contractorId: e.target.value || null })}
              options={[
                { value: "", label: "-- Select Contractor Agency --" },
                ...vendors.map((v) => ({ value: v._id, label: `${v.name} (${v.code})` })),
              ]}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-worker-phone"
              label="Phone Number"
              value={editFormData.contact?.phone || ""}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, phone: e.target.value },
                })
              }
            />

            <Input
              id="edit-worker-email"
              label="Email Address"
              type="email"
              value={editFormData.contact?.email || ""}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, email: e.target.value },
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-worker-emergency"
              label="Emergency Contact"
              value={editFormData.contact?.emergencyContact || ""}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, emergencyContact: e.target.value },
                })
              }
            />

            <Select
              id="edit-worker-status"
              label="Status"
              value={editFormData.status || "ACTIVE"}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as WorkerStatus })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "ON_LEAVE", label: "On Leave" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "TERMINATED", label: "Terminated" },
              ]}
            />
          </div>

          <Input
            id="edit-worker-notes"
            label="Notes / Certifications"
            value={editFormData.notes || ""}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updating}>
              Save Changes
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default WorkerDetailPage;
