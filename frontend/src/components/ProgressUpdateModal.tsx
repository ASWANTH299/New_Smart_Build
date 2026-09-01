import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal.js";
import { Input } from "./ui/Input.js";
import { Textarea } from "./ui/Textarea.js";
import { Button } from "./ui/Button.js";
import { ProgressIndicator } from "./ui/ProgressIndicator.js";
import { StatusBadge } from "./ui/StatusBadge.js";
import { Task, taskService } from "../services/taskService.js";
import { useToast } from "../hooks/useToast.js";

export interface ProgressUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectId: string;
  onSuccess?: () => void;
}

export const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId,
  onSuccess,
}) => {
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (task) {
      setCompletedQuantity(task.completedQuantity || 0);
      setNotes("");
    }
  }, [task]);

  if (!task) return null;

  const planned = task.plannedQuantity || 1;
  const remainingWork = Math.max(0, Math.round((planned - completedQuantity) * 100) / 100);
  const previewPercentage = Math.min(
    100,
    Math.max(0, Math.round((completedQuantity / planned) * 100 * 100) / 100)
  );

  const resultingStatus =
    previewPercentage >= 100 || completedQuantity >= planned
      ? "COMPLETED"
      : previewPercentage > 0
      ? "IN_PROGRESS"
      : "TODO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (completedQuantity < 0) {
      showError("Validation Error", "Completed quantity cannot be negative.");
      return;
    }
    if (completedQuantity > planned) {
      showError(
        "Validation Error",
        `Completed quantity cannot exceed planned quantity (${planned} ${task.unit}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.logProgress(projectId, task._id, {
        completedQuantity,
        notes: notes.trim() || undefined,
        source: "WEB",
      });

      showSuccess(
        "Progress Recorded",
        `${task.title} is now ${previewPercentage}% completed (${resultingStatus}).`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      showError(
        "Submission Failed",
        error instanceof Error ? error.message : "Error logging progress."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Progress: ${task.title}`}
      description={`Enter verified field quantities to update task and phase progression.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Planned Work Scope:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {planned} {task.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Progress:</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {task.completedQuantity} {task.unit} ({task.progress}%)
            </span>
          </div>
        </div>

        <Input
          label={`Cumulative Completed Quantity (${task.unit})`}
          type="number"
          step="any"
          required
          min={0}
          max={planned}
          value={completedQuantity}
          onChange={(e) => setCompletedQuantity(parseFloat(e.target.value) || 0)}
          helperText={`Must be between 0 and ${planned} ${task.unit}`}
        />

        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining Work:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              {remainingWork} {task.unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Auto-Reconciled Status:</span>
            <StatusBadge status={resultingStatus} size="sm" />
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Resulting Progress:</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{previewPercentage}%</span>
          </div>
          <ProgressIndicator progress={previewPercentage} size="md" />
        </div>

        <Textarea
          label="Field Observations / Notes"
          placeholder="e.g. Concrete pour completed for Level 2 slab, curing started..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Confirm & Save Progress
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProgressUpdateModal;
