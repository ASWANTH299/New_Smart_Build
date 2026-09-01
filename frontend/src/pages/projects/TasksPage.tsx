import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  CheckSquare,
  TrendingUp,
  Calendar,
  AlertCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";
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
import { userService } from "../../services/userService.js";
import { User, UserRole } from "../../types/index.js";

export const TasksPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingPhases, setIsInitializingPhases] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedPhase, setSelectedPhase] = useState("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<Task | null>(null);
  const [isQuickPhaseModalOpen, setIsQuickPhaseModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Quick Phase Form State
  const [quickPhaseName, setQuickPhaseName] = useState("");
  const [quickPhaseStart, setQuickPhaseStart] = useState("");
  const [quickPhaseEnd, setQuickPhaseEnd] = useState("");
  const [isSubmittingPhase, setIsSubmittingPhase] = useState(false);

  // Add Member State
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Create Task Form State
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
  const canManageTeam = isAdmin || isProjectManager;

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
        const phaseList = phasesRes.data;
        setPhases(phaseList);
        if (phaseList.length > 0) {
          setPhaseId((prev) => prev || phaseList[0]._id);
        }
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

  // Load registered users when opening add member modal
  const handleOpenAddMemberModal = async () => {
    setIsAddMemberModalOpen(true);
    try {
      const res = await userService.getUsers({ status: "ACTIVE", limit: 100 });
      if (res.success && res.data) {
        setAllRegisteredUsers(res.data);
        const available = res.data.filter((u) => !team.some((t) => t.id === u.id));
        if (available.length > 0) {
          setSelectedUserToAdd(available[0].id);
        }
      }
    } catch {
      showError("Error", "Failed to load registered users.");
    }
  };

  const handleInitializeDefaultPhases = async () => {
    if (!projectId) return;
    setIsInitializingPhases(true);
    try {
      const res = await phaseService.initializeDefaultPhases(projectId);
      if (res.success && res.data) {
        showSuccess("Phases Initialized", "Baseline construction phases generated successfully.");
        setPhases(res.data);
        if (res.data.length > 0) {
          setPhaseId(res.data[0]._id);
        }
      }
    } catch (error) {
      showError(
        "Initialization Failed",
        error instanceof Error ? error.message : "Error initializing construction phases."
      );
    } finally {
      setIsInitializingPhases(false);
    }
  };

  const handleQuickCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !quickPhaseName.trim() || !quickPhaseStart || !quickPhaseEnd) {
      showError("Validation Error", "Please fill in all phase fields.");
      return;
    }

    setIsSubmittingPhase(true);
    try {
      const res = await phaseService.createPhase(projectId, {
        name: quickPhaseName.trim(),
        plannedStartDate: quickPhaseStart,
        plannedEndDate: quickPhaseEnd,
      });

      if (res.success && res.data) {
        showSuccess("Phase Created", `Phase '${res.data.name}' added.`);
        setIsQuickPhaseModalOpen(false);
        setQuickPhaseName("");
        setQuickPhaseStart("");
        setQuickPhaseEnd("");
        const refreshed = await phaseService.getPhases(projectId);
        if (refreshed.success && refreshed.data) {
          setPhases(refreshed.data);
          setPhaseId(res.data._id);
        }
      }
    } catch (error) {
      showError("Creation Failed", error instanceof Error ? error.message : "Error creating phase.");
    } finally {
      setIsSubmittingPhase(false);
    }
  };

  const handleAddMemberToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedUserToAdd) {
      showError("Validation Error", "Please select a user to add.");
      return;
    }

    setIsSubmittingMember(true);
    try {
      const res = await projectService.addTeamMember(projectId, selectedUserToAdd);
      if (res.success && res.data) {
        showSuccess("Member Added", res.data.message);
        setIsAddMemberModalOpen(false);
        setAssigneeId(selectedUserToAdd);
        loadData();
      }
    } catch (error) {
      showError("Addition Failed", error instanceof Error ? error.message : "Error adding member.");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !phaseId || !title.trim() || !startDate || !endDate) {
      showError("Validation Error", "Please fill in all mandatory fields including target phase.");
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

  const availableUsersToAdd = allRegisteredUsers.filter((u) => !team.some((t) => t.id === u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to={`/projects/${projectId}`}
          className="hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Workspace
        </Link>
      </div>

      <PageHeader
        title="Project Tasks & Quantity Progress"
        description="Operational task tracking, field quantity progress logs, and phase rollups."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canManageTeam && (
              <Button
                variant="outline"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={handleOpenAddMemberModal}
              >
                Add Team Member
              </Button>
            )}
            {canCreate && (
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Task
              </Button>
            )}
          </div>
        }
      />

      {/* Empty Phases Alert Banner */}
      {phases.length === 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                No Construction Phases Configured
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Tasks require a target phase. Initialize baseline construction phases or create a custom phase to begin task assignment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              isLoading={isInitializingPhases}
              onClick={handleInitializeDefaultPhases}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Initialize Default Phases
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickPhaseModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Custom Phase
            </Button>
          </div>
        </div>
      )}

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
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {phaseName}
                    </span>
                    <Link
                      to={`/projects/${projectId}/tasks/${task._id}`}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 text-sm sm:text-base transition-colors"
                    >
                      {task.title}
                    </Link>
                    <StatusBadge status={task.status} size="sm" />
                    {task.priority === "URGENT" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>
                      Scope: <strong className="text-slate-700 dark:text-slate-200">{task.completedQuantity}</strong> /{" "}
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
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Progress</span>
                      <span className="text-brand-600 dark:text-brand-400">{task.progress}%</span>
                    </div>
                    <ProgressIndicator progress={task.progress} size="sm" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<TrendingUp className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
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

      {/* Quick Phase Creation Modal */}
      <Modal
        isOpen={isQuickPhaseModalOpen}
        onClose={() => setIsQuickPhaseModalOpen(false)}
        title="Create Construction Phase"
        description="Add a new sequential phase for this project."
      >
        <form onSubmit={handleQuickCreatePhase} className="space-y-4">
          <Input
            label="Phase Name"
            required
            placeholder="e.g. Substructure & Foundation"
            value={quickPhaseName}
            onChange={(e) => setQuickPhaseName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Start Date"
              type="date"
              required
              value={quickPhaseStart}
              onChange={(e) => setQuickPhaseStart(e.target.value)}
            />
            <Input
              label="Planned End Date"
              type="date"
              required
              value={quickPhaseEnd}
              onChange={(e) => setQuickPhaseEnd(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsQuickPhaseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingPhase}>
              Create Phase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Team Member to Project"
        description="Select a registered platform user to assign to this construction workspace."
      >
        <form onSubmit={handleAddMemberToProject} className="space-y-4">
          {availableUsersToAdd.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              All active registered platform users are already assigned to this project.
            </p>
          ) : (
            <Select
              label="Select Registered User"
              options={availableUsersToAdd.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email}) — ${u.primaryRole.replace(/_/g, " ")}`,
              }))}
              value={selectedUserToAdd}
              onChange={(e) => setSelectedUserToAdd(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddMemberModalOpen(false)}>
              Cancel
            </Button>
            {availableUsersToAdd.length > 0 && (
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmittingMember}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add to Project Team
              </Button>
            )}
          </div>
        </form>
      </Modal>

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
            placeholder="e.g. Foundation Excavation & Soil Compaction"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Phase Selection with fallback helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Construction Phase <span className="text-red-500">*</span>
              </label>
              {phases.length === 0 && (
                <button
                  type="button"
                  onClick={handleInitializeDefaultPhases}
                  className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Seed Default Phases
                </button>
              )}
            </div>

            {phases.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-2">
                <p className="text-amber-800 dark:text-amber-300 font-medium">
                  No construction phases exist for this project yet.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isInitializingPhases}
                    onClick={handleInitializeDefaultPhases}
                  >
                    Initialize 4 Default Phases
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuickPhaseModalOpen(true)}
                  >
                    + Custom Phase
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    options={phases.map((p) => ({
                      value: p._id,
                      label: `Phase ${p.sequence}: ${p.name}`,
                    }))}
                    value={phaseId}
                    onChange={(e) => setPhaseId(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickPhaseModalOpen(true)}
                  className="shrink-0"
                  title="Add another phase"
                >
                  + Phase
                </Button>
              </div>
            )}
          </div>

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
              label="Unit (e.g. sq.ft, cu.m, bags, MT)"
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lead Assignee
                </label>
                {canManageTeam && (
                  <button
                    type="button"
                    onClick={handleOpenAddMemberModal}
                    className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    + Add Member
                  </button>
                )}
              </div>
              <Select
                options={[
                  { value: "", label: "Unassigned" },
                  ...team.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.primaryRole.replace(/_/g, " ")})`,
                  })),
                ]}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />
            </div>
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
