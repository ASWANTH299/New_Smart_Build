import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Users,
  HardHat,
  Calendar,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { workforceService, AssignWorkerPayload } from "../../services/workforceService.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { taskService, Task } from "../../services/taskService.js";
import { WorkforceAssignment, Worker } from "../../types/workforce.js";
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

export const ProjectWorkforcePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [assignments, setAssignments] = useState<WorkforceAssignment[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [selectedTrade, setSelectedTrade] = useState("");

  // Assign Worker Drawer
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignData, setAssignData] = useState<AssignWorkerPayload>({
    workerId: "",
    phaseId: "",
    taskId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchWorkforceData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [assignRes, workerRes, phaseRes, taskRes] = await Promise.all([
        workforceService.getProjectWorkforce(projectId, {
          trade: selectedTrade || undefined,
        }),
        workforceService.getWorkers({ status: "ACTIVE", limit: 100 }),
        phaseService.getPhases(projectId),
        taskService.getTasks(projectId),
      ]);

      if (assignRes.success && assignRes.data) {
        setAssignments(assignRes.data);
      }
      if (workerRes.success && workerRes.data) {
        setAllWorkers(workerRes.data);
      }
      if (phaseRes.success && phaseRes.data) {
        setPhases(phaseRes.data);
      }
      if (taskRes.success && taskRes.data) {
        setTasks(taskRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project workforce");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedTrade]);

  useEffect(() => {
    fetchWorkforceData();
  }, [fetchWorkforceData]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !assignData.workerId) {
      showError("Validation Error", "Please select a worker to assign.");
      return;
    }

    try {
      setAssigning(true);
      const res = await workforceService.assignWorker(projectId, {
        workerId: assignData.workerId,
        phaseId: assignData.phaseId || null,
        taskId: assignData.taskId || null,
        startDate: assignData.startDate,
        endDate: assignData.endDate || null,
        notes: assignData.notes,
      });

      if (res.success && res.data) {
        showSuccess("Worker Assigned", "Worker successfully assigned to project tasks.");
        setIsAssignDrawerOpen(false);
        setAssignData({
          workerId: "",
          phaseId: "",
          taskId: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        });
        fetchWorkforceData();
      }
    } catch (err: unknown) {
      showError("Assignment Failed", err instanceof Error ? err.message : "Failed to assign worker");
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure you want to end this workforce assignment?")) return;

    try {
      const res = await workforceService.deleteAssignment(projectId, assignmentId);
      if (res.success) {
        showSuccess("Assignment Concluded", "Workforce assignment removed from active project tasks.");
        fetchWorkforceData();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to delete assignment");
    }
  };

  const activeCount = assignments.filter((a) => a.status === "ACTIVE").length;

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
            <span>Workforce Assignments</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
            Project Workforce & Trade Assignments
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Assign specialized trade labor, track site task allocations, and manage daily attendance sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to={`/projects/${projectId}/attendance`}>
            <Button
              id="view-attendance-btn"
              variant="outline"
              leftIcon={<ClipboardList className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            >
              Daily Attendance Sheet
            </Button>
          </Link>
          {canManage && (
            <Button
              id="assign-worker-btn"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAssignDrawerOpen(true)}
            >
              + Assign Worker
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Active Labor Count</span>
            <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
            {activeCount}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Total Historical Assignments</span>
            <HardHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-display tabular-nums font-mono">
            {assignments.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-display font-bold">
            <span>Available Catalog Workers</span>
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 font-display tabular-nums font-mono">
            {allWorkers.length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Select
            id="workforce-trade-filter"
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            options={[
              { value: "", label: "All Specialized Trades" },
              { value: "MASON", label: "Mason" },
              { value: "CARPENTER", label: "Carpenter" },
              { value: "ELECTRICIAN", label: "Electrician" },
              { value: "PLUMBER", label: "Plumber" },
              { value: "PAINTER", label: "Painter" },
              { value: "STEEL_FIXER", label: "Steel Fixer" },
              { value: "WELDER", label: "Welder" },
              { value: "HEAVY_OPERATOR", label: "Heavy Equipment Operator" },
              { value: "GENERAL_LABOR", label: "General Site Labor" },
              { value: "SURVEYOR", label: "Surveyor" },
              { value: "FOREMAN", label: "Foreman" },
            ]}
            className="w-full sm:w-64"
          />

          <div className="text-xs text-zinc-500 font-mono">
            Showing {assignments.length} workforce assignments
          </div>
        </div>
      </Card>

      {/* Workforce Assignments Table */}
      {loading ? (
        <LoadingState message="Loading project workforce..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWorkforceData} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No Workers Assigned to Project"
          description="Assign specialized trades or general labor to start tracking task execution and daily attendance."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsAssignDrawerOpen(true)}>
                Assign First Worker
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
                  <th className="py-3.5 px-4">Worker Spec</th>
                  <th className="py-3.5 px-4">Trade</th>
                  <th className="py-3.5 px-4">Assigned Phase / Task</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 font-mono text-xs">
                {assignments.map((a) => {
                  const worker = typeof a.workerId === "object" ? a.workerId : null;
                  const phase = typeof a.phaseId === "object" ? a.phaseId : null;
                  const task = typeof a.taskId === "object" ? a.taskId : null;

                  return (
                    <tr key={a._id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <Link
                          to={`/workforce/${worker?._id}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center font-display">
                            {worker?.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{worker?.name || "Worker"}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-zinc-700 dark:text-zinc-300">
                        {worker?.trade ? worker.trade.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-zinc-600 dark:text-zinc-300">
                        {task ? (
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                              {task.title}
                            </span>
                            {phase && <span className="text-[11px] text-zinc-400">Phase: {phase.name}</span>}
                          </div>
                        ) : phase ? (
                          <span>Phase: {phase.name}</span>
                        ) : (
                          <span className="text-zinc-400">General Project Allocation</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 font-mono">
                        {new Date(a.startDate).toLocaleDateString()}
                        {a.endDate ? ` → ${new Date(a.endDate).toLocaleDateString()}` : " (Ongoing)"}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status.toLowerCase()} />
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right font-sans">
                          <button
                            onClick={() => handleDeleteAssignment(a._id)}
                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold p-1"
                            title="End Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Assign Worker SlideOverDrawer */}
      <SlideOverDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        title="Assign Worker to Project"
        subtitle="Allocate trade specialist or general labor to construction phases and tasks"
        size="lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            id="assign-worker-select"
            label="Select Worker from Master Roster *"
            value={assignData.workerId}
            onChange={(e) => setAssignData({ ...assignData, workerId: e.target.value })}
            options={[
              { value: "", label: "-- Choose Worker --" },
              ...allWorkers.map((w) => ({
                value: w._id,
                label: `${w.name} (${w.trade.replace(/_/g, " ")}) — ${w.workerType}`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="assign-phase-select"
              label="Target Construction Phase (Optional)"
              value={assignData.phaseId || ""}
              onChange={(e) => setAssignData({ ...assignData, phaseId: e.target.value || null })}
              options={[
                { value: "", label: "-- All Phases / General --" },
                ...phases.map((p) => ({ value: p._id, label: `${p.sequence}. ${p.name}` })),
              ]}
            />

            <Select
              id="assign-task-select"
              label="Target Task Work Package (Optional)"
              value={assignData.taskId || ""}
              onChange={(e) => setAssignData({ ...assignData, taskId: e.target.value || null })}
              options={[
                { value: "", label: "-- General Phase Work --" },
                ...tasks.map((t) => ({ value: t._id, label: t.title })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="assign-start-date"
              label="Assignment Start Date *"
              type="date"
              value={assignData.startDate as string}
              onChange={(e) => setAssignData({ ...assignData, startDate: e.target.value })}
              required
            />

            <Input
              id="assign-end-date"
              label="Expected End Date"
              type="date"
              value={(assignData.endDate as string) || ""}
              onChange={(e) => setAssignData({ ...assignData, endDate: e.target.value || null })}
            />
          </div>

          <Input
            id="assign-notes"
            label="Assignment Notes / Instructions"
            placeholder="e.g. Lead masonry crew for north wing exterior wall"
            value={assignData.notes || ""}
            onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsAssignDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={assigning}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </SlideOverDrawer>
    </div>
  );
};

export default ProjectWorkforcePage;
