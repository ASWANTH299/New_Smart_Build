import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Shield, FolderPlus, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";
import { userService, UserDetailResponse } from "../../services/userService.js";
import { projectService, ProjectDetail } from "../../services/projectService.js";

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectDetail[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadData = React.useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [userRes, projectsRes] = await Promise.all([
        userService.getUserById(userId),
        projectService.getProjects(),
      ]);

      if (userRes.success && userRes.data) {
        setData(userRes.data);
      }
      if (projectsRes.success && projectsRes.data) {
        setAvailableProjects(projectsRes.data);
        if (projectsRes.data.length > 0) {
          setSelectedProjectId(projectsRes.data[0]._id);
        }
      }
    } catch {
      showError("Error", "Failed to load user details.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedProjectId) return;

    setIsAssigning(true);
    try {
      await userService.assignProject(userId, selectedProjectId);
      showSuccess("Assigned", "User assigned to project successfully.");
      setIsAssignModalOpen(false);
      loadData();
    } catch (error) {
      showError("Failed", error instanceof Error ? error.message : "Error assigning project");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (projectId: string) => {
    if (!userId) return;
    try {
      await userService.removeProjectAssignment(userId, projectId);
      showSuccess("Removed", "Project assignment removed.");
      loadData();
    } catch (error) {
      showError("Failed", error instanceof Error ? error.message : "Error removing assignment");
    }
  };

  if (isLoading) return <LoadingState message="Loading user profile..." />;
  if (!data) return <ErrorState title="User Not Found" message="Could not find the requested user." />;

  const { user, projectMemberships, recentLogins } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/users" className="hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Users Directory
        </Link>
      </div>

      <PageHeader
        title={user.name}
        description={`Account profile and project memberships for ${user.email}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/admin/users/${user.id}/edit`}>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
            <Button
              variant="primary"
              leftIcon={<FolderPlus className="w-4 h-4" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Project
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Account Info */}
        <div className="space-y-6">
          <Card title="Account Overview">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-900">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Primary Role</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 mt-0.5">
                  <Shield className="w-4 h-4 text-brand-600" />
                  <span>{user.primaryRole.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">Account Status</span>
                <div className="mt-1">
                  <StatusBadge status={user.status} />
                </div>
              </div>
              {user.lastLoginAt && (
                <div>
                  <span className="text-slate-500 block">Last Active</span>
                  <span className="text-slate-700">{new Date(user.lastLoginAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Additional Permissions">
            {user.additionalPermissions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No additional overrides granted.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.additionalPermissions.map((perm) => (
                  <span key={perm} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {perm}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Project Memberships & Login History */}
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Project Assignments (${projectMemberships.length})`}>
            {projectMemberships.length === 0 ? (
              <p className="text-xs text-slate-500 italic">User is not assigned to any projects currently.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {projectMemberships.map((m) => {
                  const proj = availableProjects.find((p) => p._id === m.projectId);
                  return (
                    <div key={m.projectId} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block">
                          {proj ? proj.name : m.projectId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Assigned on {new Date(m.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveAssignment(m.projectId)}
                        title="Remove project assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Recent Login Activity">
            {recentLogins.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No recorded login attempts.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLogins.map((log, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.success ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="font-medium text-slate-700">{log.success ? "Successful Sign In" : "Failed Sign In"}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span>{log.ipAddress}</span> • <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Project to Team Member"
        description="Grants access to operational project data."
      >
        <form onSubmit={handleAssignProject} className="space-y-4">
          <Select
            label="Select Active Project"
            options={availableProjects.map((p) => ({
              value: p._id,
              label: `${p.name} (${p.code})`,
            }))}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isAssigning}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserDetailPage;
