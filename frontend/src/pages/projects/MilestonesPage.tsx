import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Flag, Calendar, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { milestoneService, Milestone, MilestoneStatus } from "../../services/milestoneService.js";
import { phaseService, Phase } from "../../services/phaseService.js";
import { projectService } from "../../services/projectService.js";
import { User, UserRole } from "../../types/index.js";

export const MilestonesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [clientVisible, setClientVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Modal
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [nextStatus, setNextStatus] = useState<MilestoneStatus>("ACHIEVED");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { showSuccess, showError } = useToast();
  const { isAdmin, isProjectManager } = usePermissions();
  const canManage = isAdmin || isProjectManager;

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [milestonesRes, phasesRes, teamRes] = await Promise.all([
        milestoneService.getMilestones(projectId),
        phaseService.getPhases(projectId),
        projectService.getProjectTeam(projectId),
      ]);

      if (milestonesRes.success && milestonesRes.data) {
        setMilestones(milestonesRes.data);
      }
      if (phasesRes.success && phasesRes.data) {
        setPhases(phasesRes.data);
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
      showError("Error", "Failed to load project milestones.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !name || !plannedDate) {
      showError("Validation Error", "Please fill in all mandatory milestone fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await milestoneService.createMilestone(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        phaseId: phaseId || undefined,
        plannedDate,
        responsibleUserId: responsibleUserId || undefined,
        clientVisible,
      });

      showSuccess("Milestone Created", `Added milestone: ${name}`);
      setIsModalOpen(false);
      setName("");
      setDescription("");
      setPlannedDate("");
      loadData();
    } catch (error) {
      showError(
        "Creation Failed",
        error instanceof Error ? error.message : "Error creating milestone."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedMilestone) return;

    setIsUpdatingStatus(true);
    try {
      await milestoneService.updateMilestone(projectId, selectedMilestone._id, {
        status: nextStatus,
        actualDate: nextStatus === "ACHIEVED" ? new Date().toISOString() : null,
      });

      showSuccess("Milestone Updated", `Status updated to ${nextStatus}`);
      setSelectedMilestone(null);
      loadData();
    } catch (error) {
      showError(
        "Update Failed",
        error instanceof Error ? error.message : "Error updating status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading project milestones..." />;

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
        title="Project Milestones & Key Gates"
        description="Critical contractual deliveries, phase completions, and client milestone sign-offs."
        actions={
          canManage ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Milestone
            </Button>
          ) : undefined
        }
      />

      {milestones.length === 0 ? (
        <EmptyState
          title="No Milestones Defined"
          description="Establish key dates, foundation completion gates, and client handovers."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Add First Milestone
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestones.map((milestone) => {
            const isOverdue =
              milestone.status === "PENDING" &&
              new Date(milestone.plannedDate) < new Date();

            return (
              <Card key={milestone._id} className="h-full border-slate-200 hover:shadow-card">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-brand-50 text-brand-700">
                        <Flag className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{milestone.name}</h3>
                        {milestone.phaseId && (
                          <span className="text-[11px] font-medium text-slate-500">
                            {milestone.phaseId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={milestone.status} size="sm" />
                      {milestone.clientVisible ? (
                        <span title="Client Visible" className="p-1 text-slate-400">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Internal Only" className="p-1 text-slate-400">
                          <EyeOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {milestone.description && (
                    <p className="text-xs text-slate-600">{milestone.description}</p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Target: {new Date(milestone.plannedDate).toLocaleDateString()}
                      </span>
                      {isOverdue && (
                        <span className="text-red-600 font-bold ml-1 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    {milestone.responsibleUserId && (
                      <span className="truncate max-w-[140px]">
                        Lead: {milestone.responsibleUserId.name}
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setNextStatus(milestone.status === "PENDING" ? "ACHIEVED" : "PENDING");
                        }}
                      >
                        Update Gate Status
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Project Key Milestone"
        description="Establish target date and contractual completion criteria."
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <Input
            label="Milestone Name"
            required
            placeholder="e.g. Plinth Level Concrete Completion"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label="Associated Phase (Optional)"
            options={[
              { value: "", label: "None / Overall Project Gate" },
              ...phases.map((p) => ({
                value: p._id,
                label: `Phase ${p.sequence}: ${p.name}`,
              })),
            ]}
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Delivery Date"
              type="date"
              required
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />

            <Select
              label="Responsible Lead"
              options={[
                { value: "", label: "Unassigned" },
                ...team.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.primaryRole})`,
                })),
              ]}
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
            />
          </div>

          <Textarea
            label="Milestone Scope / Sign-off Criteria"
            placeholder="Key deliverables, testing certificates, and inspection approvals needed..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={clientVisible}
              onChange={(e) => setClientVisible(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Show on Client Portal Dashboard</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Flag className="w-4 h-4" />}
            >
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        title={`Update Status: ${selectedMilestone?.name}`}
        description="Verify milestone completion or report delay."
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Milestone Gate Status"
            options={[
              { value: "PENDING", label: "PENDING — Target in progress" },
              { value: "ACHIEVED", label: "ACHIEVED — Sign-off completed" },
              { value: "MISSED", label: "MISSED — Target date breached" },
            ]}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as MilestoneStatus)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setSelectedMilestone(null)}>
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

export default MilestonesPage;
