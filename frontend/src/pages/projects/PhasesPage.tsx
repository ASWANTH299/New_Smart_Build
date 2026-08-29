import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Layers, Calendar, CheckSquare } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { projectService, ProjectDetail } from "../../services/projectService.js";

export const PhasesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager } = usePermissions();
  const canManage = isAdmin || isProjectManager;

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projRes, phasesRes] = await Promise.all([
        projectService.getProjectById(projectId),
        phaseService.getPhases(projectId),
      ]);
      if (projRes.success && projRes.data) {
        setProject(projRes.data);
      }
      if (phasesRes.success && phasesRes.data) {
        setPhases(phasesRes.data);
      }
    } catch {
      showError("Error", "Failed to load project phases.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !name || !startDate || !endDate) {
      showError("Validation Error", "Please fill in all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await phaseService.createPhase(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        sequence: phases.length + 1,
      });

      showSuccess("Phase Created", `Added ${name} to project schedule.`);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      loadData();
    } catch (error) {
      showError(
        "Creation Failed",
        error instanceof Error ? error.message : "Error creating phase."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading project phases..." />;

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
        title={project ? `${project.name} — Construction Phases` : "Project Phases"}
        description="Sequential construction roadmap, milestones, and task progression rollups."
        actions={
          canManage ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Project Phase
            </Button>
          ) : undefined
        }
      />

      {phases.length === 0 ? (
        <EmptyState
          title="No Phases Defined"
          description="Create structured phases (e.g. Substructure, Superstructure, MEP, Finishing) to organize project execution."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Add First Phase
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {phases.map((phase) => (
            <Link
              key={phase._id}
              to={`/projects/${projectId}/phases/${phase._id}`}
              className="block group"
            >
              <Card className="h-full border-slate-200 dark:border-slate-800 group-hover:border-brand-500 dark:group-hover:border-brand-500 group-hover:shadow-md transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-mono text-xs font-bold flex items-center justify-center border border-brand-200 dark:border-brand-900">
                        {phase.sequence}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-base transition-colors">
                        {phase.name}
                      </h3>
                    </div>
                    <StatusBadge status={phase.status} size="sm" />
                  </div>

                  {phase.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {phase.description}
                    </p>
                  )}

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Phase Progression:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{phase.progress}%</span>
                    </div>
                    <ProgressIndicator progress={phase.progress} size="md" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(phase.plannedStartDate).toLocaleDateString()} –{" "}
                        {new Date(phase.plannedEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>
                        {phase.completedTaskCount || 0} / {phase.taskCount || 0} Tasks
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Project Construction Phase"
        description="Define milestone timeline boundaries for the execution roadmap."
      >
        <form onSubmit={handleCreatePhase} className="space-y-4">
          <Input
            label="Phase Name"
            required
            placeholder="e.g. Substructure & Foundation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Phase Description / Scope"
            placeholder="Excavation, footings, plinth beam, and anti-termite treatment..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Create Phase
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PhasesPage;
