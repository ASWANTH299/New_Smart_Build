import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Layers,
  CheckSquare,
  Flag,
  AlertTriangle,
  HeartPulse,
  Package,
  UserPlus,
  UserX,
  Sparkles,
  Users,
  Shield,
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
import { ErrorState } from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";
import { useProjectContext } from "../../hooks/useProjectContext.js";
import { usePermissions } from "../../hooks/useAuth.js";
import {
  projectService,
  ProjectOverviewData,
} from "../../services/projectService.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { milestoneService, Milestone } from "../../services/milestoneService.js";
import { userService } from "../../services/userService.js";
import { ProjectContextType, User } from "../../types/index.js";

export const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<ProjectOverviewData | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [team, setTeam] = useState<
    Array<{
      membershipId: string;
      user: { id: string; name: string; email: string; primaryRole: string };
      assignedAt: string;
    }>
  >([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingPhases, setIsInitializingPhases] = useState(false);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ProjectContextType["status"]>("ACTIVE");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add Team Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const { activeProject, setActiveProject } = useProjectContext();
  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager } = usePermissions();
  const canManage = isAdmin || isProjectManager;

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [overviewRes, teamRes, phasesRes, milestonesRes] = await Promise.all([
        projectService.getProjectOverview(projectId),
        projectService.getProjectTeam(projectId),
        phaseService.getPhases(projectId),
        milestoneService.getMilestones(projectId),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setData(overviewRes.data);
      }
      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
      }
      if (phasesRes.success && phasesRes.data) {
        setPhases(phasesRes.data);
      }
      if (milestonesRes.success && milestonesRes.data) {
        setMilestones(milestonesRes.data);
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

  const handleOpenAddMemberModal = async () => {
    setIsAddMemberModalOpen(true);
    try {
      const res = await userService.getUsers({ status: "ACTIVE", limit: 100 });
      if (res.success && res.data) {
        setAllRegisteredUsers(res.data);
        const available = res.data.filter((u) => !team.some((t) => t.user.id === u.id));
        if (available.length > 0) {
          setSelectedUserToAdd(available[0].id);
        }
      }
    } catch {
      showError("Error", "Failed to load platform users directory.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedUserToAdd) {
      showError("Validation Error", "Please select a registered user to assign.");
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await projectService.addTeamMember(projectId, selectedUserToAdd);
      if (res.success && res.data) {
        showSuccess("Member Assigned", res.data.message);
        setIsAddMemberModalOpen(false);
        loadData();
      }
    } catch (error) {
      showError(
        "Assignment Failed",
        error instanceof Error ? error.message : "Error assigning user to project."
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!projectId) return;
    if (!confirm(`Are you sure you want to remove ${targetName} from this project?`)) return;

    setRemovingUserId(targetUserId);
    try {
      await projectService.removeTeamMember(projectId, targetUserId);
      showSuccess("Member Removed", `Removed ${targetName} from the project roster.`);
      loadData();
    } catch (error) {
      showError(
        "Removal Failed",
        error instanceof Error ? error.message : "Error removing team member."
      );
    } finally {
      setRemovingUserId(null);
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
  const availableUsersToAdd = allRegisteredUsers.filter((u) => !team.some((t) => t.user.id === u.id));

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
        badge={
          <div className="flex items-center gap-1.5">
            <StatusBadge status={project.health} size="md" />
            <StatusBadge status={project.status} size="md" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant={isCurrentActive ? "secondary" : "outline"}
              onClick={handleSetCurrentContext}
              leftIcon={isCurrentActive ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : undefined}
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
                  Change Lifecycle
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Quick Access Navigation Bar for Project Modules */}
      <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-x-auto transition-colors duration-150">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display px-2 shrink-0">
          Project Modules:
        </span>
        <Link to={`/projects/${projectId}/phases`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Phases ({phases.length})
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/tasks`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Tasks & Work Tracking
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/milestones`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Flag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Milestones ({milestones.length})
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/bom`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Package className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Bill of Materials (BOM)
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/material-requests`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Material Requests
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/procurement-requests`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Procurement Requests
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/purchase-orders`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Package className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Purchase Orders
          </Button>
        </Link>
        <Link to={`/projects/${projectId}/receiving`} className="shrink-0">
          <Button variant="outline" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}>
            Receiving & GRN
          </Button>
        </Link>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label="Lifecycle Status"
          value={project.status}
          subtext="Current project stage"
          icon={<RotateCcw className="w-5 h-5" />}
        />
        <Metric
          label="Schedule Health"
          value={project.health}
          subtext={project.health === "HEALTHY" ? "Schedule on target" : "Requires attention"}
          icon={<HeartPulse className="w-5 h-5" />}
        />
        <Metric
          label="Days Remaining"
          value={`${daysRemaining} Days`}
          subtext={`Target: ${new Date(project.plannedEndDate).toLocaleDateString()}`}
          icon={<Flag className="w-5 h-5" />}
        />
        <Metric
          label="Assigned Team"
          value={`${team.length}`}
          subtext="Active members on site"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Progress & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Construction Progress Rollup">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Overall Project Completion</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{project.progress || 0}%</span>
              </div>
              <ProgressIndicator progress={project.progress || 0} size="lg" />

              {project.description && (
                <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p>{project.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Construction Phases Progress Breakdown */}
          <Card
            title={`Construction Phases Roadmap (${phases.length})`}
            action={
              <div className="flex items-center gap-2">
                {phases.length === 0 && canManage && (
                  <button
                    type="button"
                    onClick={handleInitializeDefaultPhases}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-Initialize
                  </button>
                )}
                <Link to={`/projects/${projectId}/phases`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View All
                </Link>
              </div>
            }
          >
            {phases.length === 0 ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No phases defined for this project.</p>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isInitializingPhases}
                    onClick={handleInitializeDefaultPhases}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    Initialize 4 Default Construction Phases
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {phases.slice(0, 4).map((p) => (
                  <Link
                    key={p._id}
                    to={`/projects/${projectId}/phases/${p._id}`}
                    className="block p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 font-mono text-[10px] font-bold flex items-center justify-center">
                          {p.sequence}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.progress}%</span>
                        <StatusBadge status={p.status} size="sm" />
                      </div>
                    </div>
                    <ProgressIndicator progress={p.progress} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Key Milestones */}
          <Card
            title={`Upcoming Milestone Gates (${milestones.length})`}
            action={
              <Link to={`/projects/${projectId}/milestones`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                View All
              </Link>
            }
          >
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No milestones defined.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {milestones.slice(0, 4).map((m) => (
                  <div key={m._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Flag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{m.name}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Due {new Date(m.plannedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={m.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Project Meta Details & Health Engine Output */}
        <div className="space-y-6">
          {/* Health Assessment Details */}
          <Card title="Project Health Intelligence">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Health Rating:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[11px] ${
                    project.health === "HEALTHY"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      : project.health === "AT_RISK"
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                      : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  {project.health}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block">Contributing Factors:</span>
                {!project.healthFactors || project.healthFactors.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 italic">No active risk factors detected.</p>
                ) : (
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    {project.healthFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{factor}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card title="Project Details">
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Project Manager</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {project.projectManagerId?.name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Construction Type</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {project.typeId?.name || "Standard Project"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Site Location</span>
                <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{project.location}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Start Date</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    {new Date(project.plannedStartDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Target Handover</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    {new Date(project.plannedEndDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dedicated Project Team & Members Section */}
      <Card
        title={`Project Team & Operational Workforce (${team.length})`}
        action={
          canManage ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={handleOpenAddMemberModal}
            >
              Add Member to Project
            </Button>
          ) : undefined
        }
      >
        {team.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No team members are currently assigned to this project.
            </p>
            {canManage && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddMemberModal}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Assign First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.map((member) => (
              <div
                key={member.membershipId}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {member.user.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-mono">
                    {member.user.email}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                    <Shield className="w-3 h-3" />
                    <span>{member.user.primaryRole.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 shrink-0 p-1.5 h-auto"
                    title={`Remove ${member.user.name} from project`}
                    isLoading={removingUserId === member.user.id}
                    onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Team Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Assign User to Project Team"
        description="Select an active platform user (Site Engineer, Store Manager, Contractor, Client, etc.) to assign."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          {availableUsersToAdd.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              All active registered platform users are already assigned to this project team.
            </p>
          ) : (
            <Select
              label="Select Platform User"
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
                isLoading={isAddingMember}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Member to Project
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Status Lifecycle Modal */}
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
