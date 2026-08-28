import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, CheckSquare, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { FilterBar } from "../../components/ui/FilterBar.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Select } from "../../components/ui/Select.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ProgressUpdateModal } from "../../components/ProgressUpdateModal.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { taskService, Task, TaskPriority } from "../../services/taskService.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { projectService } from "../../services/projectService.js";
import { User, UserRole } from "../../types/index.js";

export const TasksPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedPhase, setSelectedPhase] = useState("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [plannedQty, setPlannedQty] = useState(100);
  const [unit, setUnit] = useState("sq.ft");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager, isSiteEngineer } = usePermissions();
  const canCreate = isAdmin || isProjectManager || isSiteEngineer;

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [tasksRes, phasesRes, teamRes] = await Promise.all([
        taskService.getTasks(projectId, {
          search: searchTerm || undefined,
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
          priority: selectedPriority !== "ALL" ? selectedPriority : undefined,
          phaseId: selectedPhase !== "ALL" ? selectedPhase : undefined,
        }),
        phaseService.getPhases(projectId),
        projectService.getProjectTeam(projectId),
      ]);

      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data);
      }
      if (phasesRes.success && phasesRes.data) {
        setPhases(phasesRes.data);
        const firstId = phasesRes.data[0]?._id || "";
        setPhaseId((prev) => prev || firstId);
      }
      if (teamRes.success && teamRes.data) {
        const teamUsers: User[] = teamRes.data.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          primaryRole: m.user.primaryRole as UserRole,
          additionalPermissions: [],
          effectivePermissions: [],
          status: "ACTIVE",
        }));
        setTeam(teamUsers);
      }
    } catch {
      showError("Error", "Failed to load project tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, searchTerm, selectedStatus, selectedPriority, selectedPhase, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !phaseId || !title || !startDate || !endDate) {
      showError("Validation Error", "Please fill in all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.createTask(projectId, {
        phaseId,
        title: title.trim(),
        description: description.trim() || undefined,
        plannedQuantity: plannedQty,
        unit: unit.trim() || "units",
        priority,
        assigneeId: assigneeId || undefined,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
      });

      showSuccess("Task Created", `Created task: ${title}`);
      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
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

  if (isLoading) return <LoadingState message="Loading tasks directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to={`/projects/${projectId}`}
          className="hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Workspace
        </Link>
      </div>

      <PageHeader
        title="Project Tasks & Quantity Progress"
        description="Operational task tracking, field quantity progress logs, and phase rollups."
        actions={
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Task
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search tasks by title..."
        hasActiveFilters={
          selectedStatus !== "ALL" ||
          selectedPriority !== "ALL" ||
          selectedPhase !== "ALL"
        }
        onClearFilters={() => {
          setSelectedStatus("ALL");
          setSelectedPriority("ALL");
          setSelectedPhase("ALL");
          setSearchTerm("");
        }}
      >
        <div className="flex gap-2 flex-wrap">
          <Select
            options={[
              { value: "ALL", label: "All Phases" },
              ...phases.map((p) => ({ value: p._id, label: `Phase ${p.sequence}: ${p.name}` })),
            ]}
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
          />
          <Select
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "TODO", label: "To Do" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "IN_REVIEW", label: "In Review" },
              { value: "BLOCKED", label: "Blocked" },
              { value: "COMPLETED", label: "Completed" },
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
          <Select
            options={[
              { value: "ALL", label: "All Priorities" },
              { value: "LOW", label: "Low Priority" },
              { value: "MEDIUM", label: "Medium Priority" },
              { value: "HIGH", label: "High Priority" },
              { value: "URGENT", label: "Urgent Priority" },
            ]}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          />
        </div>
      </FilterBar>

      {tasks.length === 0 ? (
        <EmptyState
          title="No Tasks Found"
          description="Create your first task or adjust filter parameters."
          action={
            canCreate ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const phaseName =
              typeof task.phaseId === "object" ? task.phaseId?.name : "General Phase";
            return (
              <div
                key={task._id}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {phaseName}
                    </span>
                    <Link
                      to={`/projects/${projectId}/tasks/${task._id}`}
                      className="font-bold text-slate-900 hover:text-brand-600 text-sm sm:text-base"
                    >
                      {task.title}
                    </Link>
                    <StatusBadge status={task.status} size="sm" />
                    {task.priority === "URGENT" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>
                      Scope: <strong>{task.completedQuantity}</strong> /{" "}
                      {task.plannedQuantity} {task.unit}
                    </span>
                    <span>•</span>
                    <span>Assignee: {task.assigneeId?.name || "Unassigned"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due {new Date(task.plannedEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-32 sm:w-40 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Progress</span>
                      <span className="text-brand-600">{task.progress}%</span>
                    </div>
                    <ProgressIndicator progress={task.progress} size="sm" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<TrendingUp className="w-3.5 h-3.5 text-brand-600" />}
                    onClick={() => setSelectedTaskForProgress(task)}
                  >
                    Log Progress
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Entry Modal */}
      {projectId && (
        <ProgressUpdateModal
          isOpen={!!selectedTaskForProgress}
          onClose={() => setSelectedTaskForProgress(null)}
          task={selectedTaskForProgress}
          projectId={projectId}
          onSuccess={loadData}
        />
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project Task"
        description="Define task parameters, quantity-based scope, and assignment."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="e.g. Foundation Excavation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select
            label="Target Construction Phase"
            options={phases.map((p) => ({
              value: p._id,
              label: `Phase ${p.sequence}: ${p.name}`,
            }))}
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Scope / Quantity"
              type="number"
              required
              min={0.01}
              value={plannedQty}
              onChange={(e) => setPlannedQty(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Unit (e.g. sq.ft, cu.m, bags)"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={[
                { value: "LOW", label: "Low Priority" },
                { value: "MEDIUM", label: "Medium Priority" },
                { value: "HIGH", label: "High Priority" },
                { value: "URGENT", label: "Urgent Priority" },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            />
            <Select
              label="Lead Assignee"
              options={[
                { value: "", label: "Unassigned" },
                ...team.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.primaryRole})`,
                })),
              ]}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Planned End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Task Description"
            placeholder="Detailed construction specifications, tolerances, and QA criteria..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<CheckSquare className="w-4 h-4" />}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
