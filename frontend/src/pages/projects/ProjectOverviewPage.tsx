import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Metric } from "../../components/ui/Metric.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";
import { useProjectContext } from "../../hooks/useProjectContext.js";
import { usePermissions } from "../../hooks/useAuth.js";
import {
  projectService,
  ProjectOverviewData,
} from "../../services/projectService.js";
import { ProjectContextType } from "../../types/index.js";

export const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<ProjectOverviewData | null>(null);
  const [team, setTeam] = useState<
    Array<{
      membershipId: string;
      user: { id: string; name: string; email: string; primaryRole: string };
      assignedAt: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ProjectContextType["status"]>("ACTIVE");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { activeProject, setActiveProject } = useProjectContext();
  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager } = usePermissions();

  const loadData = React.useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [overviewRes, teamRes] = await Promise.all([
        projectService.getProjectOverview(projectId),
        projectService.getProjectTeam(projectId),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setData(overviewRes.data);
      }
      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
      }
    } catch {
      showError("Error", "Unable to load project workspace details.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetCurrentContext = () => {
    if (!data) return;
    const p = data.project;
    setActiveProject({
      id: p._id,
      code: p.code,
      name: p.name,
      status: p.status,
      health: p.health,
      progress: p.progress,
    });
    showSuccess("Context Updated", `Active workspace set to ${p.name}`);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setIsUpdatingStatus(true);
    try {
      await projectService.updateProjectStatus(projectId, nextStatus);
      showSuccess("Status Updated", `Project lifecycle transitioned to ${nextStatus}`);
      setIsStatusModalOpen(false);
      loadData();
    } catch (error) {
      showError(
        "Transition Failed",
        error instanceof Error ? error.message : "Error transitioning status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading project workspace..." />;
  if (!data) return <ErrorState title="Project Not Found" message="Could not find the requested project." />;

  const { project, daysRemaining } = data;
  const isCurrentActive = activeProject?.id === project._id;
  const canManage = isAdmin || isProjectManager;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/projects" className="hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
        </Link>
      </div>

      <PageHeader
        title={`${project.name} (${project.code})`}
        description={project.location}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isCurrentActive ? "secondary" : "outline"}
              onClick={handleSetCurrentContext}
              leftIcon={isCurrentActive ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : undefined}
            >
              {isCurrentActive ? "Active Workspace" : "Set as Active Project"}
            </Button>
            {canManage && (
              <>
                <Link to={`/projects/${project._id}/edit`}>
                  <Button variant="outline">Edit Settings</Button>
                </Link>
                <Button
                  variant="primary"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  Change Lifecycle Status
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Lifecycle Status" value={project.status} />
        <Metric label="Schedule Health" value={project.health} />
        <Metric label="Days Remaining" value={`${daysRemaining} Days`} />
        <Metric label="Active Team" value={`${team.length} Members`} />
      </div>

      {/* Progress & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Construction Progress & Milestone Status">
            <div className="space-y-4">
              <ProgressIndicator progress={project.progress || 0} size="lg" />
              <div className="text-xs text-slate-600 space-y-2 pt-2">
                <p>{project.description || "No scope description specified."}</p>
              </div>
            </div>
          </Card>

          <Card title={`Project Team Roster (${team.length})`}>
            {team.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No team members assigned.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.map((member) => (
                  <div
                    key={member.membershipId}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        {member.user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {member.user.email}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 uppercase">
                      {member.user.primaryRole.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Project Meta Details */}
        <div className="space-y-6">
          <Card title="Project Details">
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block">Project Manager</span>
                <span className="font-semibold text-slate-900">
                  {project.projectManagerId?.name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Construction Type</span>
                <span className="font-semibold text-slate-900">
                  {project.typeId?.name || "Standard Project"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Site Location</span>
                <div className="flex items-center gap-1 font-semibold text-slate-900 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{project.location}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Start Date</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {new Date(project.plannedStartDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Target Handover</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {new Date(project.plannedEndDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Transition Project Lifecycle"
        description="Select next state according to project progression."
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Next Lifecycle Stage"
            options={[
              { value: "PLANNING", label: "PLANNING — Setup & Pre-construction" },
              { value: "ACTIVE", label: "ACTIVE — Site Execution Underway" },
              { value: "ON_HOLD", label: "ON_HOLD — Temporary Suspension" },
              { value: "COMPLETED", label: "COMPLETED — Final Handover Complete" },
              { value: "ARCHIVED", label: "ARCHIVED — Closed Record" },
            ]}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as ProjectContextType["status"])}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUpdatingStatus}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectOverviewPage;
