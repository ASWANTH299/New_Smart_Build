import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Edit2,
  FolderKanban,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  equipmentService,
  CreateEquipmentPayload,
  ReportBreakdownPayload,
  ScheduleMaintenancePayload,
  RecordInspectionPayload,
} from "../../services/equipmentService.js";
import {
  Equipment,
  EquipmentAssignment,
  EquipmentMaintenance,
  EquipmentInspection,
  EquipmentCategory,
  EquipmentStatus,
  MaintenanceType,
  InspectionResult,
} from "../../types/equipment.js";
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

export const EquipmentDetailPage: React.FC = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<EquipmentAssignment[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<EquipmentAssignment[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<EquipmentMaintenance[]>([]);
  const [inspections, setInspections] = useState<EquipmentInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawers
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isBreakdownDrawerOpen, setIsBreakdownDrawerOpen] = useState(false);
  const [isMaintenanceDrawerOpen, setIsMaintenanceDrawerOpen] = useState(false);
  const [isInspectionDrawerOpen, setIsInspectionDrawerOpen] = useState(false);

  // Form states
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CreateEquipmentPayload>>({});
  const [breakdownData, setBreakdownData] = useState<ReportBreakdownPayload>({
    description: "",
    cost: 0,
    notes: "",
  });
  const [maintenanceData, setMaintenanceData] = useState<ScheduleMaintenancePayload>({
    type: "PREVENTIVE",
    scheduledDate: new Date().toISOString().split("T")[0],
    description: "",
    cost: 0,
    performedBy: "",
    notes: "",
  });
  const [inspectionData, setInspectionData] = useState<RecordInspectionPayload>({
    result: "PASSED",
    findings: "",
    nextInspectionDate: "",
    notes: "",
    checklistItems: [
      { item: "Hydraulic system & fluid levels", passed: true },
      { item: "Braking & emergency stop systems", passed: true },
      { item: "Operator cabin & safety harness", passed: true },
      { item: "Structural integrity & weld inspection", passed: true },
    ],
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const canInspect =
    canManage || user?.primaryRole === "SITE_ENGINEER";

  const fetchEquipmentDetail = useCallback(async () => {
    if (!equipmentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await equipmentService.getEquipmentById(equipmentId);

      if (res.success && res.data) {
        setEquipment(res.data.equipment);
        setActiveAssignments(res.data.activeAssignments || []);
        setAssignmentHistory(res.data.assignmentHistory || []);
        setMaintenanceRecords(res.data.maintenanceRecords || []);
        setInspections(res.data.inspections || []);

        const eq = res.data.equipment;
        setEditFormData({
          name: eq.name,
          category: eq.category,
          ownershipType: eq.ownershipType,
          status: eq.status,
          make: eq.make,
          modelNumber: eq.modelNumber,
          serialNumber: eq.serialNumber,
          hourlyRate: eq.hourlyRate,
          currentLocation: eq.currentLocation,
          notes: eq.notes,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load equipment profile");
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchEquipmentDetail();
  }, [fetchEquipmentDetail]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId) return;

    try {
      setUpdating(true);
      const res = await equipmentService.updateEquipment(equipmentId, editFormData);
      if (res.success) {
        showSuccess("Profile Updated", "Equipment details saved successfully.");
        setIsEditDrawerOpen(false);
        fetchEquipmentDetail();
      }
    } catch (err: unknown) {
      showError("Update Error", err instanceof Error ? err.message : "Failed to update equipment");
    } finally {
      setUpdating(false);
    }
  };

  const handleBreakdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !breakdownData.description.trim()) {
      showError("Validation Error", "Breakdown description is required.");
      return;
    }

    try {
      setUpdating(true);
      const res = await equipmentService.reportBreakdown(equipmentId, breakdownData);
      if (res.success) {
        showSuccess(
          "Breakdown Logged",
          "Equipment marked as BREAKDOWN and emergency repair ticket generated."
        );
        setIsBreakdownDrawerOpen(false);
        setBreakdownData({ description: "", cost: 0, notes: "" });
        fetchEquipmentDetail();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to report breakdown");
    } finally {
      setUpdating(false);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !maintenanceData.description.trim()) {
      showError("Validation Error", "Maintenance description is required.");
      return;
    }

    try {
      setUpdating(true);
      const res = await equipmentService.scheduleMaintenance(equipmentId, maintenanceData);
      if (res.success) {
        showSuccess("Maintenance Scheduled", "Service ticket logged successfully.");
        setIsMaintenanceDrawerOpen(false);
        setMaintenanceData({
          type: "PREVENTIVE",
          scheduledDate: new Date().toISOString().split("T")[0],
          description: "",
          cost: 0,
          performedBy: "",
          notes: "",
        });
        fetchEquipmentDetail();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to schedule maintenance");
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteMaintenance = async (maintenanceId: string) => {
    if (!equipmentId) return;
    try {
      const res = await equipmentService.completeMaintenance(equipmentId, maintenanceId, {
        status: "COMPLETED",
        completedDate: new Date().toISOString(),
      });
      if (res.success) {
        showSuccess("Service Completed", "Maintenance completed and equipment status refreshed.");
        fetchEquipmentDetail();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to complete maintenance");
    }
  };

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId) return;

    try {
      setUpdating(true);
      const res = await equipmentService.recordInspection(equipmentId, inspectionData);
      if (res.success) {
        showSuccess("Inspection Logged", "Safety inspection record saved successfully.");
        setIsInspectionDrawerOpen(false);
        fetchEquipmentDetail();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to record inspection");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading equipment details..." />;
  if (error || !equipment) return <ErrorState message={error || "Equipment not found"} onRetry={fetchEquipmentDetail} />;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans">
        <Link
          to="/equipment"
          className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Equipment Fleet
        </Link>
        <span>/</span>
        <span>{equipment.code}</span>
      </div>

      {/* Hero Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center font-extrabold text-xl font-display shadow-sm shadow-amber-500/20">
            {equipment.code.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                {equipment.name}
              </h1>
              <StatusBadge status={equipment.status.toLowerCase()} size="md" />
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap font-sans">
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {equipment.code}
              </span>
              <span>•</span>
              <span>{equipment.category.replace(/_/g, " ")}</span>
              <span>•</span>
              <span className="font-mono uppercase">{equipment.ownershipType}</span>
              {equipment.make && <span>• Make: {equipment.make} {equipment.modelNumber || ""}</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canInspect && (
            <Button
              id="report-breakdown-btn"
              variant="outline"
              size="sm"
              leftIcon={<AlertTriangle className="w-4 h-4 text-red-500" />}
              onClick={() => setIsBreakdownDrawerOpen(true)}
            >
              Report Breakdown
            </Button>
          )}

          {canManage && (
            <Button
              id="schedule-maintenance-btn"
              variant="outline"
              size="sm"
              leftIcon={<Wrench className="w-4 h-4 text-amber-500" />}
              onClick={() => setIsMaintenanceDrawerOpen(true)}
            >
              Schedule Service
            </Button>
          )}

          {canInspect && (
            <Button
              id="log-inspection-btn"
              variant="outline"
              size="sm"
              leftIcon={<ClipboardCheck className="w-4 h-4 text-brand-500" />}
              onClick={() => setIsInspectionDrawerOpen(true)}
            >
              Safety Inspection
            </Button>
          )}

          {canManage && (
            <Button
              id="edit-equipment-btn"
              variant="primary"
              size="sm"
              leftIcon={<Edit2 className="w-4 h-4" />}
              onClick={() => setIsEditDrawerOpen(true)}
            >
              Edit Specs
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Specs / Deployments / Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tech Specs & Location */}
        <div className="space-y-6">
          <Card title="Technical Specifications">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px] font-sans">Equipment Code / Tag</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{equipment.code}</span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-sans">Current Yard / Depot</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{equipment.currentLocation || "Depot"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Serial / VIN</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{equipment.serialNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Model Year</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{equipment.yearOfManufacture || "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Hourly Rate</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{equipment.hourlyRate || 0}/hr</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Service Cycle</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Every {equipment.maintenanceSchedule?.frequencyMonths || 6} mos
                  </span>
                </div>
              </div>

              {equipment.notes && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold font-display">Notes</span>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">{equipment.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Deployments & Service Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Deployments */}
          <Card
            title={`Active Project Deployments (${activeAssignments.length})`}
            subtitle="Current construction sites and task allocations"
          >
            {activeAssignments.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">
                Equipment is not currently deployed to any active project tasks.
              </p>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((a) => {
                  const proj = typeof a.projectId === "object" ? a.projectId : null;
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
                        {task && (
                          <div className="text-zinc-500 pl-6">
                            Task: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{task.title}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-zinc-400 pl-6 font-mono">
                          Schedule: {new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-6 sm:pl-0">
                        <StatusBadge status={a.status.toLowerCase()} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Past Deployments History */}
          {assignmentHistory.length > 0 && (
            <Card
              title={`Past Deployment History (${assignmentHistory.length})`}
              subtitle="Previous project allocations and demobilized assignments"
            >
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-xs">
                {assignmentHistory.map((a) => {
                  const proj = typeof a.projectId === "object" ? a.projectId : null;
                  return (
                    <div key={a._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans block">
                          {proj ? proj.name : "Project"}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={a.status.toLowerCase()} size="sm" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Maintenance & Repair History */}
          <Card
            title={`Maintenance & Repair History (${maintenanceRecords.length})`}
            subtitle="Scheduled servicing, emergency breakdown repairs, and parts replacement"
          >
            {maintenanceRecords.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">
                No maintenance service records logged yet.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {maintenanceRecords.map((m) => (
                  <div key={m._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                            m.type === "BREAKDOWN"
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {m.type}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 font-sans">{m.description}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        Scheduled: {new Date(m.scheduledDate).toLocaleDateString()}
                        {m.completedDate ? ` • Completed: ${new Date(m.completedDate).toLocaleDateString()}` : ""}
                        {m.cost > 0 ? ` • Cost: ₹${m.cost.toLocaleString()}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <StatusBadge status={m.status.toLowerCase()} size="sm" />
                      {m.status !== "COMPLETED" && canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteMaintenance(m._id)}
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Safety Inspections */}
          <Card
            title={`Safety Inspection Logs (${inspections.length})`}
            subtitle="On-site safety assessments and compliance checks"
          >
            {inspections.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">
                No safety inspections recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {inspections.map((insp) => (
                  <div key={insp._id} className="py-3 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5 font-sans">
                      <div className="flex items-center gap-2">
                        {insp.result === "PASSED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          Result: {insp.result}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono pl-6">
                        Date: {new Date(insp.inspectionDate).toLocaleDateString()}
                        {insp.findings ? ` • ${insp.findings}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={insp.result === "PASSED" ? "completed" : "blocked"} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Report Breakdown Drawer */}
      <SlideOverDrawer
        isOpen={isBreakdownDrawerOpen}
        onClose={() => setIsBreakdownDrawerOpen(false)}
        title="Report Equipment Breakdown"
        subtitle={`Flag ${equipment.name} as out-of-order and initiate emergency maintenance`}
        size="md"
      >
        <form onSubmit={handleBreakdownSubmit} className="space-y-4">
          <Input
            id="breakdown-description"
            label="Breakdown Reason / Issue Description *"
            placeholder="e.g. Hydraulic pressure drop during lifting operation"
            value={breakdownData.description}
            onChange={(e) => setBreakdownData({ ...breakdownData, description: e.target.value })}
            required
          />

          <Input
            id="breakdown-cost"
            label="Estimated Emergency Repair Cost (₹)"
            type="number"
            min="0"
            value={breakdownData.cost || 0}
            onChange={(e) => setBreakdownData({ ...breakdownData, cost: parseFloat(e.target.value) || 0 })}
          />

          <Input
            id="breakdown-notes"
            label="Site Incident Notes"
            placeholder="e.g. Machine shut down safely. Operator reported no injuries."
            value={breakdownData.notes || ""}
            onChange={(e) => setBreakdownData({ ...breakdownData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsBreakdownDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updating}>
              Log Breakdown Ticket
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Schedule Maintenance Drawer */}
      <SlideOverDrawer
        isOpen={isMaintenanceDrawerOpen}
        onClose={() => setIsMaintenanceDrawerOpen(false)}
        title="Schedule Equipment Maintenance"
        subtitle={`Book preventive service or overhaul for ${equipment.name}`}
        size="md"
      >
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          <Select
            id="maintenance-type-select"
            label="Service Type *"
            value={maintenanceData.type}
            onChange={(e) =>
              setMaintenanceData({ ...maintenanceData, type: e.target.value as MaintenanceType })
            }
            options={[
              { value: "PREVENTIVE", label: "Scheduled Preventive Service" },
              { value: "CORRECTIVE", label: "Corrective Repair" },
              { value: "INSPECTION_SERVICE", label: "Periodic Calibration & Overhaul" },
              { value: "BREAKDOWN", label: "Emergency Breakdown Repair" },
            ]}
            required
          />

          <Input
            id="maintenance-date"
            label="Scheduled Date *"
            type="date"
            value={maintenanceData.scheduledDate}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, scheduledDate: e.target.value })}
            required
          />

          <Input
            id="maintenance-desc"
            label="Work Description *"
            placeholder="e.g. Replace engine oil, hydraulic filters, inspect track tension"
            value={maintenanceData.description}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
            required
          />

          <Input
            id="maintenance-performed-by"
            label="Technician / Service Agency"
            placeholder="e.g. Caterpillar Authorized Service Center"
            value={maintenanceData.performedBy || ""}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, performedBy: e.target.value })}
          />

          <Input
            id="maintenance-cost"
            label="Estimated Service Cost (₹)"
            type="number"
            min="0"
            value={maintenanceData.cost || 0}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, cost: parseFloat(e.target.value) || 0 })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsMaintenanceDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updating}>
              Confirm Maintenance
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Safety Inspection Drawer */}
      <SlideOverDrawer
        isOpen={isInspectionDrawerOpen}
        onClose={() => setIsInspectionDrawerOpen(false)}
        title="Record Safety Inspection"
        subtitle={`Log on-site technical inspection for ${equipment.name}`}
        size="md"
      >
        <form onSubmit={handleInspectionSubmit} className="space-y-4">
          <Select
            id="inspection-result-select"
            label="Inspection Result *"
            value={inspectionData.result}
            onChange={(e) =>
              setInspectionData({ ...inspectionData, result: e.target.value as InspectionResult })
            }
            options={[
              { value: "PASSED", label: "Passed — Certified Fit for Site Operation" },
              { value: "PASSED_WITH_CONDITIONS", label: "Passed with Minor Observations" },
              { value: "FAILED", label: "Failed — Unsafe / Service Required" },
            ]}
            required
          />

          <Input
            id="inspection-findings"
            label="Inspector Findings & Remarks"
            placeholder="e.g. All hydraulic seals intact, emergency brake response 0.4s"
            value={inspectionData.findings || ""}
            onChange={(e) => setInspectionData({ ...inspectionData, findings: e.target.value })}
          />

          <Input
            id="inspection-next-date"
            label="Next Scheduled Inspection Date"
            type="date"
            value={inspectionData.nextInspectionDate || ""}
            onChange={(e) => setInspectionData({ ...inspectionData, nextInspectionDate: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsInspectionDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updating}>
              Save Inspection
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Edit Equipment Specs Drawer */}
      <SlideOverDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title="Edit Equipment Details"
        subtitle={`Modify specifications for ${equipment.code}`}
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            id="edit-eq-name"
            label="Equipment Name *"
            value={editFormData.name || ""}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="edit-eq-category"
              label="Category *"
              value={editFormData.category || "EARTHMOVING"}
              onChange={(e) =>
                setEditFormData({ ...editFormData, category: e.target.value as EquipmentCategory })
              }
              options={[
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
              ]}
              required
            />

            <Select
              id="edit-eq-status"
              label="Status"
              value={editFormData.status || "AVAILABLE"}
              onChange={(e) =>
                setEditFormData({ ...editFormData, status: e.target.value as EquipmentStatus })
              }
              options={[
                { value: "AVAILABLE", label: "Available" },
                { value: "ASSIGNED", label: "Assigned" },
                { value: "IN_USE", label: "In Use" },
                { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
                { value: "BREAKDOWN", label: "Breakdown" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "RETIRED", label: "Retired" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-eq-hourly-rate"
              label="Operational Cost Rate (₹ / hr)"
              type="number"
              min="0"
              value={editFormData.hourlyRate || 0}
              onChange={(e) =>
                setEditFormData({ ...editFormData, hourlyRate: parseFloat(e.target.value) || 0 })
              }
            />

            <Input
              id="edit-eq-location"
              label="Yard / Depot Location"
              value={editFormData.currentLocation || ""}
              onChange={(e) => setEditFormData({ ...editFormData, currentLocation: e.target.value })}
            />
          </div>

          <Input
            id="edit-eq-notes"
            label="Notes"
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

export default EquipmentDetailPage;
