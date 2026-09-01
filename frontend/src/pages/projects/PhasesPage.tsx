import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Layers, Calendar, CheckSquare, Sparkles } from "lucide-react";
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
  const [isInitializing, setIsInitializing] = useState(false);
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

  const handleInitializeDefaultPhases = async () => {
    if (!projectId) return;
    setIsInitializing(true);
    try {
      const res = await phaseService.initializeDefaultPhases(projectId);
      if (res.success && res.data) {
        showSuccess("Phases Initialized", "Baseline construction phases generated successfully.");
        setPhases(res.data);
      }
    } catch (error) {
      showError(
        "Initialization Failed",
        error instanceof Error ? error.message : "Error initializing construction phases."
      );
    } finally {
      setIsInitializing(false);
    }
  };

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
            <div className="flex items-center gap-2 flex-wrap">
              {phases.length === 0 && (
                <Button
                  variant="outline"
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
                  isLoading={isInitializing}
                  onClick={handleInitializeDefaultPhases}
                >
                  Initialize Baseline Phases
                </Button>
              )}
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Add Project Phase
              </Button>
            </div>
          ) : undefined
        }
      />

      {phases.length === 0 ? (
        <EmptyState
          title="No Phases Defined"
          description="Create structured phases (e.g. Substructure, Superstructure, MEP, Finishing) or initialize baseline construction blueprints."
          action={
            canManage ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  isLoading={isInitializing}
                  onClick={handleInitializeDefaultPhases}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Initialize 4 Baseline Phases
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  Add Custom Phase
                </Button>
              </div>
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

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span>Phase Progress</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {phase.progress}%
                      </span>
                    </div>
                    <ProgressIndicator progress={phase.progress} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(phase.plannedStartDate).toLocaleDateString()} -{" "}
                        {new Date(phase.plannedEndDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{phase.taskCount || 0} tasks</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Phase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Project Construction Phase"
        description="Define phase name, chronological sequence, and milestone boundaries."
      >
        <form onSubmit={handleCreatePhase} className="space-y-4">
          <Input
            label="Phase Name"
            required
            placeholder="e.g. Superstructure Concrete Frame"
            value={name}
            onChange={(e) => setName(e.target.value)}
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

          <Textarea
            label="Phase Scope & Specifications"
            placeholder="Key civil engineering specifications, trade handoffs, and deliverables..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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
              Add Phase
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PhasesPage;
