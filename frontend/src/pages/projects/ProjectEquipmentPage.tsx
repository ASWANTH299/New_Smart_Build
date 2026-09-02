import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Truck,
  Wrench,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { equipmentService, AssignEquipmentPayload } from "../../services/equipmentService.js";
import { taskService, Task } from "../../services/taskService.js";
import { EquipmentAssignment, Equipment } from "../../types/equipment.js";
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

export const ProjectEquipmentPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Drawer
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignData, setAssignData] = useState<AssignEquipmentPayload>({
    equipmentId: "",
    taskId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    purpose: "",
    meterReadingStart: 0,
    notes: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchProjectEquipmentData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [assignRes, eqRes, taskRes] = await Promise.all([
        equipmentService.getProjectEquipment(projectId),
        equipmentService.getEquipmentList({ limit: 100 }),
        taskService.getTasks(projectId),
      ]);

      if (assignRes.success && assignRes.data) {
        setAssignments(assignRes.data);
      }
      if (eqRes.success && eqRes.data) {
        setAllEquipment(eqRes.data);
      }
      if (taskRes.success && taskRes.data) {
        setTasks(taskRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project equipment");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectEquipmentData();
  }, [fetchProjectEquipmentData]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !assignData.equipmentId) {
      showError("Validation Error", "Please select an equipment unit to assign.");
      return;
    }

    try {
      setAssigning(true);
      const res = await equipmentService.assignEquipment(projectId, {
        equipmentId: assignData.equipmentId,
        taskId: assignData.taskId || null,
        startDate: assignData.startDate,
        endDate: assignData.endDate,
        purpose: assignData.purpose,
        meterReadingStart: assignData.meterReadingStart || 0,
        notes: assignData.notes,
      });

      if (res.success && res.data) {
        showSuccess("Equipment Deployed", "Machine successfully deployed to project site.");
        setIsAssignDrawerOpen(false);
        setAssignData({
          equipmentId: "",
          taskId: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          purpose: "",
          meterReadingStart: 0,
          notes: "",
        });
        fetchProjectEquipmentData();
      }
    } catch (err: unknown) {
      showError("Assignment Conflict / Error", err instanceof Error ? err.message : "Failed to deploy equipment");
    } finally {
      setAssigning(false);
    }
  };

  const handleReturnEquipment = async (assignmentId: string) => {
    if (!projectId) return;
    if (!confirm("Confirm equipment demobilization / return from site?")) return;

    try {
      const res = await equipmentService.updateAssignment(projectId, assignmentId, {
        status: "COMPLETED",
        actualReturnDate: new Date().toISOString(),
      });
      if (res.success) {
        showSuccess("Equipment Returned", "Demobilization completed and equipment status updated.");
        fetchProjectEquipmentData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to return equipment");
    }
  };

  const activeAssignments = assignments.filter((a) => a.status === "ACTIVE");
  const totalHourlyBurn = activeAssignments.reduce((sum, a) => {
    const eq = typeof a.equipmentId === "object" ? a.equipmentId : null;
    return sum + (eq?.hourlyRate || 0);
  }, 0);

  const selectedMachine = allEquipment.find((e) => e._id === assignData.equipmentId);
  const isSelectedUnavailable =
    selectedMachine &&
    (selectedMachine.status === "UNDER_MAINTENANCE" ||
      selectedMachine.status === "BREAKDOWN" ||
      selectedMachine.status === "RETIRED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1 font-sans">
            <Link
              to={`/projects/${projectId}`}
              className="hover:underline text-brand-600 dark:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Project Workspace
            </Link>
            <span>/</span>
            <span>Equipment Deployments</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Site Equipment & Heavy Machinery
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Active plant & machinery on site, deployment schedules, conflict checks, and return tracking.
          </p>
        </div>

        {canManage && (
          <Button
            id="deploy-equipment-btn"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAssignDrawerOpen(true)}
          >
            + Deploy Equipment
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Active Machines On-Site</span>
            <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
            {activeAssignments.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Total Fleet Utilization</span>
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-display tabular-nums font-mono">
            {assignments.length} assignments
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Fleet Operational Burn</span>
            <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
            ₹{totalHourlyBurn}/hr
          </div>
        </div>
      </div>

      {/* Deployed Equipment Table */}
      {loading ? (
        <LoadingState message="Loading site equipment roster..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProjectEquipmentData} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No Equipment Deployed to this Project"
          description="Deploy earthmoving, concrete, or material handling machinery to support site construction packages."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsAssignDrawerOpen(true)}>
                Deploy First Machine
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
                  <th className="py-3.5 px-4">Equipment Unit</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Work Package / Task</th>
                  <th className="py-3.5 px-4">Deployment Schedule</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {assignments.map((a) => {
                  const eq = typeof a.equipmentId === "object" ? a.equipmentId : null;
                  const task = typeof a.taskId === "object" ? a.taskId : null;

                  return (
                    <tr key={a._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <Link
                          to={`/equipment/${eq?._id}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center font-display">
                            {eq?.code.slice(0, 3) || "EQ"}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                              {eq?.name || "Equipment"}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">{eq?.code}</span>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-zinc-700 dark:text-zinc-300 font-medium">
                        {eq?.category ? eq.category.replace(/_/g, " ") : "—"}
                      </td>

                      <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-400">
                        {task ? task.title : a.purpose || "General Site Allocation"}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 font-mono">
                        {new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status.toLowerCase()} />
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right font-sans">
                          {a.status === "ACTIVE" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-zinc-500" />}
                              onClick={() => handleReturnEquipment(a._id)}
                            >
                              Demobilize
                            </Button>
                          ) : (
                            <span className="text-zinc-400 text-xs font-mono">Returned</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deploy Equipment SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        title="Deploy Equipment to Site"
        subtitle="Allocate machinery with automated schedule conflict detection"
        size="lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            id="deploy-equipment-select"
            label="Select Machine from Master Fleet *"
            value={assignData.equipmentId}
            onChange={(e) => setAssignData({ ...assignData, equipmentId: e.target.value })}
            options={[
              { value: "", label: "-- Choose Equipment Unit --" },
              ...allEquipment.map((eq) => ({
                value: eq._id,
                label: `${eq.code} - ${eq.name} (${eq.status})`,
              })),
            ]}
            required
          />

          {isSelectedUnavailable && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Warning: Selected machine is currently <strong>{selectedMachine?.status}</strong>. Deployment will be rejected.
              </span>
            </div>
          )}

          <Select
            id="deploy-task-select"
            label="Target Task Work Package (Optional)"
            value={assignData.taskId || ""}
            onChange={(e) => setAssignData({ ...assignData, taskId: e.target.value || null })}
            options={[
              { value: "", label: "-- General Site Allocation --" },
              ...tasks.map((t) => ({ value: t._id, label: t.title })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="deploy-start-date"
              label="Deployment Start Date *"
              type="date"
              value={assignData.startDate}
              onChange={(e) => setAssignData({ ...assignData, startDate: e.target.value })}
              required
            />

            <Input
              id="deploy-end-date"
              label="Expected End Date *"
              type="date"
              value={assignData.endDate}
              onChange={(e) => setAssignData({ ...assignData, endDate: e.target.value })}
              required
            />
          </div>

          <Input
            id="deploy-purpose"
            label="Deployment Purpose / Activity"
            placeholder="e.g. Foundation basement excavation & soil disposal"
            value={assignData.purpose || ""}
            onChange={(e) => setAssignData({ ...assignData, purpose: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsAssignDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={assigning}
              disabled={!!isSelectedUnavailable}
            >
              Confirm Deployment
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default ProjectEquipmentPage;
