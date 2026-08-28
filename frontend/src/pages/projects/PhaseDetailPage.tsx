import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, CheckSquare, Layers } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Metric } from "../../components/ui/Metric.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { taskService, Task, TaskPriority } from "../../services/taskService.js";
import { projectService } from "../../services/projectService.js";
import { User, UserRole } from "../../types/index.js";

export const PhaseDetailPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPlannedQty, setTaskPlannedQty] = useState(100);
  const [taskUnit, setTaskUnit] = useState("sq.ft");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager, isSiteEngineer } = usePermissions();
  const canManage = isAdmin || isProjectManager || isSiteEngineer;

  const loadData = useCallback(async () => {
    if (!projectId || !phaseId) return;
    setIsLoading(true);
    try {
      const [phaseRes, tasksRes, engineersRes] = await Promise.all([
        phaseService.getPhaseById(projectId, phaseId),
        taskService.getTasks(projectId, { phaseId }),
        projectService.getProjectTeam(projectId),
      ]);

      if (phaseRes.success && phaseRes.data) {
        setPhase(phaseRes.data);
      }
      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data);
      }
      if (engineersRes.success && engineersRes.data) {
        const teamUsers: User[] = engineersRes.data.map((m) => ({
          id: m.user.id || (m.user as { _id?: string; id?: string })._id || "",
          name: m.user.name,
          email: m.user.email,
          primaryRole: m.user.primaryRole as UserRole,
          additionalPermissions: [],
          effectivePermissions: [],
          status: "ACTIVE",
        }));
        setEngineers(teamUsers);
      }
    } catch {
      showError("Error", "Failed to load phase details.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, phaseId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !phaseId || !taskTitle || !taskStartDate || !taskEndDate) {
      showError("Validation Error", "Please fill in all mandatory task fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.createTask(projectId, {
        phaseId,
        title: taskTitle.trim(),
        plannedQuantity: taskPlannedQty,
        unit: taskUnit.trim() || "units",
        priority: taskPriority,
        assigneeId: taskAssignee || undefined,
        plannedStartDate: taskStartDate,
        plannedEndDate: taskEndDate,
      });

      showSuccess("Task Created", `Added task ${taskTitle} to phase.`);
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskStartDate("");
      setTaskEndDate("");
      loadData();
    } catch (error) {
      showError(
        "Creation Failed",
        error instanceof Error ? error.message : "Error creating task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading phase details..." />;
  if (!phase) return <EmptyState title="Phase Not Found" description="The requested phase does not exist." />;

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to={`/projects/${projectId}/phases`}
          className="hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Phases
        </Link>
      </div>

      <PageHeader
        title={`Phase ${phase.sequence}: ${phase.name}`}
        description={phase.description || "Detailed task breakdown and scope tracking for this phase."}
        actions={
          canManage ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Task to Phase
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Phase Status" value={phase.status.replace(/_/g, " ")} />
        <Metric label="Completion Progress" value={`${phase.progress}%`} />
        <Metric label="Tasks Completed" value={`${completedCount} of ${tasks.length}`} />
        <Metric
          label="Planned Duration"
          value={`${new Date(phase.plannedStartDate).toLocaleDateString()} - ${new Date(phase.plannedEndDate).toLocaleDateString()}`}
        />
      </div>

      <Card title="Phase Progression Overview">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold">Cumulative Progress</span>
            <span className="font-bold text-brand-600">{phase.progress}%</span>
          </div>
          <ProgressIndicator progress={phase.progress} size="lg" />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-brand-600" /> Tasks in Phase ({tasks.length})
          </h2>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No Tasks in this Phase"
            description="Break down this phase into operational tasks with planned quantities."
            action={
              canManage ? (
                <Button variant="primary" onClick={() => setIsTaskModalOpen(true)}>
                  Create Task
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => (
              <Link
                key={task._id}
                to={`/projects/${projectId}/tasks/${task._id}`}
                className="block group"
              >
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-600 text-sm">
                        {task.title}
                      </h3>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        Scope: {task.completedQuantity} / {task.plannedQuantity} {task.unit}
                      </span>
                      <span>•</span>
                      <span>Assignee: {task.assigneeId?.name || "Unassigned"}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{task.progress}%</span>
                      <span className="text-slate-400">
                        Due {new Date(task.plannedEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    <ProgressIndicator progress={task.progress} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task to Phase"
        description={`Create a new task within ${phase.name}.`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="e.g. Column Rebar Binding"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Quantity"
              type="number"
              required
              min={0.01}
              value={taskPlannedQty}
              onChange={(e) => setTaskPlannedQty(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Unit of Measurement"
              required
              placeholder="e.g. sq.ft, cu.m, tonnes, nos"
              value={taskUnit}
              onChange={(e) => setTaskUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "URGENT", label: "Urgent" },
              ]}
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
            />

            <Select
              label="Assignee"
              options={[
                { value: "", label: "Unassigned" },
                ...engineers.map((u) => ({ value: u.id, label: `${u.name} (${u.primaryRole})` })),
              ]}
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Start Date"
              type="date"
              required
              value={taskStartDate}
              onChange={(e) => setTaskStartDate(e.target.value)}
            />
            <Input
              label="Planned End Date"
              type="date"
              required
              value={taskEndDate}
              onChange={(e) => setTaskEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PhaseDetailPage;
