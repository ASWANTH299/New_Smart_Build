import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  RotateCcw,
  Calendar,
  History,
  Link as LinkIcon,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Metric } from "../../components/ui/Metric.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ProgressUpdateModal } from "../../components/ProgressUpdateModal.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { taskService, Task, TaskStatus } from "../../services/taskService.js";
import { progressService, ProgressRecord } from "../../services/progressService.js";

export const TaskDetailPage: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<TaskStatus>("IN_PROGRESS");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager, isSiteEngineer, isContractor } = usePermissions();
  const canUpdate = isAdmin || isProjectManager || isSiteEngineer || isContractor;

  const loadData = useCallback(async () => {
    if (!projectId || !taskId) return;
    setIsLoading(true);
    try {
      const [taskRes, historyRes] = await Promise.all([
        taskService.getTaskById(projectId, taskId),
        progressService.getProgressHistory(projectId, { taskId }),
      ]);

      if (taskRes.success && taskRes.data) {
        setTask(taskRes.data);
        setNextStatus(taskRes.data.status);
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch {
      showError("Error", "Failed to load task details.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !taskId) return;

    setIsUpdatingStatus(true);
    try {
      await taskService.updateTaskStatus(projectId, taskId, nextStatus);
      showSuccess("Status Updated", `Task status transitioned to ${nextStatus}`);
      setIsStatusModalOpen(false);
      loadData();
    } catch (error) {
      showError(
        "Transition Failed",
        error instanceof Error ? error.message : "Error updating status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading task details..." />;
  if (!task) return <EmptyState title="Task Not Found" description="The requested task does not exist." />;

  const phaseObj = typeof task.phaseId === "object" ? task.phaseId : null;
  const remainingQty = Math.max(0, task.plannedQuantity - task.completedQuantity);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to={`/projects/${projectId}/tasks`}
          className="hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Tasks
        </Link>
      </div>

      <PageHeader
        title={task.title}
        description={
          phaseObj ? `Part of Phase ${phaseObj.sequence || ""}: ${phaseObj.name}` : "General project task"
        }
        actions={
          canUpdate ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setIsStatusModalOpen(true)}
              >
                Change Status
              </Button>
              <Button
                variant="primary"
                leftIcon={<TrendingUp className="w-4 h-4" />}
                onClick={() => setIsProgressModalOpen(true)}
              >
                Log Completed Quantity
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Current Status" value={task.status.replace(/_/g, " ")} />
        <Metric label="Completion" value={`${task.progress}%`} />
        <Metric
          label="Scope Remaining"
          value={`${remainingQty} ${task.unit}`}
        />
        <Metric label="Priority Level" value={task.priority} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress & Quantities */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Quantity Progress Tracking">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">Calculated Completion Percentage</span>
                <span className="font-bold text-brand-600">{task.progress}%</span>
              </div>
              <ProgressIndicator progress={task.progress} size="lg" />

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[11px] text-slate-500 block">Planned Quantity</span>
                  <span className="text-sm font-bold text-slate-900">
                    {task.plannedQuantity} {task.unit}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="text-[11px] text-emerald-700 block">Completed Quantity</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {task.completedQuantity} {task.unit}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <span className="text-[11px] text-amber-700 block">Remaining Work</span>
                  <span className="text-sm font-bold text-amber-900">
                    {remainingQty} {task.unit}
                  </span>
                </div>
              </div>

              {task.description && (
                <div className="pt-2 text-xs text-slate-600">
                  <span className="font-semibold block text-slate-900 mb-1">Specifications:</span>
                  <p>{task.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Dependencies Card */}
          <Card title="Finish-to-Start Prerequisites">
            {!task.dependencies || task.dependencies.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No prerequisite dependencies.</p>
            ) : (
              <div className="space-y-2">
                {task.dependencies.map((dep) => (
                  <div
                    key={dep._id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900">{dep.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">{dep.progress}%</span>
                      <StatusBadge status={dep.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Historical Progress Records */}
          <Card title={`Field Progress Log History (${history.length})`}>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No historical progress recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((record) => (
                  <div key={record._id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-brand-600" />
                        <span className="font-bold text-slate-900">
                          {record.completedQuantity} {record.unit} logged
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {record.source}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Logged by {record.enteredBy?.name || "Field User"}</span>
                      {record.notes && <span className="italic">"{record.notes}"</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Meta Information */}
        <div className="space-y-6">
          <Card title="Task Information">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Lead Assignee</span>
                <span className="font-semibold text-slate-900">
                  {task.assigneeId ? `${task.assigneeId.name} (${task.assigneeId.primaryRole})` : "Unassigned"}
                </span>
              </div>
              {task.contractorId && (
                <div>
                  <span className="text-slate-500 block">Contractor Lead</span>
                  <span className="font-semibold text-slate-900">{task.contractorId.name}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block">Construction Phase</span>
                <span className="font-semibold text-slate-900">
                  {phaseObj ? `Phase ${phaseObj.sequence || ""}: ${phaseObj.name}` : "General"}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Planned Schedule</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(task.plannedStartDate).toLocaleDateString()} –{" "}
                      {new Date(task.plannedEndDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {task.actualStartDate && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Actual Execution</span>
                    <span className="font-semibold text-slate-900">
                      Started {new Date(task.actualStartDate).toLocaleDateString()}
                      {task.actualEndDate && ` • Completed ${new Date(task.actualEndDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Progress Entry Modal */}
      {projectId && (
        <ProgressUpdateModal
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          task={task}
          projectId={projectId}
          onSuccess={loadData}
        />
      )}

      {/* Status Transition Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Task Status"
        description="Transition status according to site execution."
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Target Task Status"
            options={[
              { value: "TODO", label: "TODO — Ready to start" },
              { value: "IN_PROGRESS", label: "IN_PROGRESS — Active on site" },
              { value: "IN_REVIEW", label: "IN_REVIEW — Verification underway" },
              { value: "BLOCKED", label: "BLOCKED — Prerequisite pending" },
              { value: "COMPLETED", label: "COMPLETED — Scope finished" },
            ]}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as TaskStatus)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUpdatingStatus}>
              Confirm Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
