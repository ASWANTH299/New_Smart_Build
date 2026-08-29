import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Inbox,
  Trash2,
  Eye,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { DataTable } from "../../components/ui/DataTable.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { FilterBar } from "../../components/ui/FilterBar.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { userService, AccessRequest } from "../../services/userService.js";
import { User, UserRole } from "../../types/index.js";

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Access Requests State
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestSearchTerm, setRequestSearchTerm] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("ALL");

  // Create/Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("SITE_ENGINEER");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Approve Request Modal State
  const [selectedRequestForApprove, setSelectedRequestForApprove] = useState<AccessRequest | null>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole>("SITE_ENGINEER");
  const [isApproving, setIsApproving] = useState(false);
  const [generatedActivationToken, setGeneratedActivationToken] = useState<string | null>(null);

  // Reject Request Modal State
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<AccessRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Safe Delete User State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchUsers = React.useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await userService.getUsers({
        search: searchTerm || undefined,
        role: selectedRole !== "ALL" ? selectedRole : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      showError("Error", "Failed to load user directory.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [searchTerm, selectedRole, selectedStatus, showError]);

  const fetchRequests = React.useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await userService.getAccessRequests({
        status: requestStatusFilter !== "ALL" ? requestStatusFilter : undefined,
      });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch {
      showError("Error", "Failed to load access requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  }, [requestStatusFilter, showError]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchRequests();
    }
  }, [activeTab, fetchUsers, fetchRequests]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setIsSubmittingInvite(true);
    try {
      const res = await userService.createUser({
        name: inviteName,
        email: inviteEmail,
        primaryRole: inviteRole,
      });
      if (res.success) {
        showSuccess("User Created", `Invitation generated for ${inviteEmail}`);
        setIsInviteModalOpen(false);
        setInviteName("");
        setInviteEmail("");
        fetchUsers();
      }
    } catch (error) {
      showError("Creation Failed", error instanceof Error ? error.message : "Error creating user");
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    try {
      await userService.updateUserStatus(user.id, newStatus);
      showSuccess("Status Updated", `User marked as ${newStatus.toLowerCase()}`);
      fetchUsers();
    } catch (error) {
      showError("Failed", error instanceof Error ? error.message : "Error updating status");
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    if (currentUser?.id === userToDelete.id) {
      showError("Action Denied", "Administrators cannot delete their own account.");
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      const res = await userService.deleteUser(userToDelete.id);
      if (res.success) {
        showSuccess("Account Removed", `User account for ${userToDelete.email} has been deactivated and removed from active project assignments.`);
        setUserToDelete(null);
        fetchUsers();
      } else {
        showError("Deletion Failed", res.message || "Failed to delete user account.");
      }
    } catch (error) {
      showError("Deletion Failed", error instanceof Error ? error.message : "Error deleting user account.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleOpenApproveModal = (req: AccessRequest) => {
    setSelectedRequestForApprove(req);
    setAssignedRole(req.requestedRole);
    setGeneratedActivationToken(null);
  };

  const handleApproveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForApprove) return;

    setIsApproving(true);
    try {
      const res = await userService.approveAccessRequest(selectedRequestForApprove._id, {
        assignedRole,
      });
      if (res.success && res.data) {
        showSuccess("Request Approved", `Account created in pending activation for ${selectedRequestForApprove.email}`);
        setGeneratedActivationToken(res.data.activationToken);
        fetchRequests();
      }
    } catch (error) {
      showError("Approval Failed", error instanceof Error ? error.message : "Error approving access request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRejectModal = (req: AccessRequest) => {
    setSelectedRequestForReject(req);
    setRejectionReason("");
  };

  const handleRejectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReject || !rejectionReason.trim()) {
      showError("Validation Error", "Please provide a reason for rejecting this request.");
      return;
    }

    setIsRejecting(true);
    try {
      const res = await userService.rejectAccessRequest(selectedRequestForReject._id, {
        reason: rejectionReason.trim(),
      });
      if (res.success) {
        showSuccess("Request Rejected", `Access request for ${selectedRequestForReject.email} has been rejected.`);
        setSelectedRequestForReject(null);
        fetchRequests();
      }
    } catch (error) {
      showError("Rejection Failed", error instanceof Error ? error.message : "Error rejecting access request");
    } finally {
      setIsRejecting(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

  const filteredRequests = requests.filter((r) => {
    if (!requestSearchTerm.trim()) return true;
    const term = requestSearchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.organization && r.organization.toLowerCase().includes(term))
    );
  });

  const userColumns = [
    {
      key: "details",
      header: "User Details",
      accessor: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <Link to={`/admin/users/${u.id}`} className="font-semibold text-slate-900 hover:text-brand-600 hover:underline truncate">
              {u.name}
            </Link>
            <span className="text-xs text-slate-500 truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Primary Role",
      accessor: (u: User) => <StatusBadge status={u.primaryRole} size="sm" />,
    },
    {
      key: "status",
      header: "Status",
      accessor: (u: User) => <StatusBadge status={u.status} size="sm" />,
    },
    {
      key: "createdAt",
      header: "Joined Date",
      accessor: (u: User) => (
        <span className="text-xs text-slate-600">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      accessor: (u: User) => (
        <span className="text-xs text-slate-500">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      accessor: (u: User) => {
        const isSelf = currentUser?.id === u.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Link to={`/admin/users/${u.id}`}>
              <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(u)}
              disabled={isSelf}
              title={isSelf ? "Cannot deactivate own account" : undefined}
              className={
                u.status === "ACTIVE"
                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              }
            >
              {u.status === "ACTIVE" ? (
                <span className="flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5" /> Deactivate
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Activate
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserToDelete(u)}
              disabled={isSelf}
              title={isSelf ? "Cannot deactivate own account" : "Deactivate & remove account"}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const requestColumns = [
    {
      key: "requester",
      header: "Requester Details",
      accessor: (r: AccessRequest) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{r.name}</span>
          <span className="text-xs text-slate-500">{r.email}</span>
          {r.organization && (
            <span className="text-[11px] text-slate-400 mt-0.5">Org: {r.organization}</span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Requested Role",
      accessor: (r: AccessRequest) => (
        <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700">
          <Shield className="w-3.5 h-3.5 text-brand-600" />
          <span>{r.requestedRole.replace(/_/g, " ")}</span>
        </div>
      ),
    },
    {
      key: "date",
      header: "Requested Date",
      accessor: (r: AccessRequest) => (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r: AccessRequest) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Review Actions",
      accessor: (r: AccessRequest) => (
        <div className="flex items-center gap-2">
          {r.status === "PENDING" ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenApproveModal(r)}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenRejectModal(r)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">
              {r.status === "APPROVED" ? `Approved as ${r.assignedRole}` : `Rejected: ${r.rejectionReason || "No reason"}`}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Access Management"
        description="Review public access requests, manage platform team memberships, and configure role authorizations."
        actions={
          activeTab === "users" ? (
            <Button
              variant="primary"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Direct Invite User
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Users ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Access Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search users by name or email..."
          >
            <div className="flex items-center gap-2">
              <Select
                options={[
                  { label: "All Roles", value: "ALL" },
                  { label: "Admin", value: "ADMIN" },
                  { label: "Project Manager", value: "PROJECT_MANAGER" },
                  { label: "Site Engineer", value: "SITE_ENGINEER" },
                  { label: "Store Manager", value: "STORE_MANAGER" },
                  { label: "Contractor", value: "CONTRACTOR" },
                  { label: "Client", value: "CLIENT" },
                ]}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              />
              <Select
                options={[
                  { label: "All Statuses", value: "ALL" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Pending Activation", value: "PENDING_ACTIVATION" },
                  { label: "Deactivated", value: "DEACTIVATED" },
                  { label: "Locked", value: "LOCKED" },
                ]}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              />
            </div>
          </FilterBar>

          <DataTable
            columns={userColumns}
            data={users}
            isLoading={isLoadingUsers}
            emptyTitle="No users found"
            emptyDescription="No users match the search or filter criteria."
          />
        </>
      ) : (
        <>
          <FilterBar
            searchTerm={requestSearchTerm}
            onSearchChange={setRequestSearchTerm}
            placeholder="Search requests by name, email, or org..."
          >
            <Select
              options={[
                { label: "All Requests", value: "ALL" },
                { label: "Pending Review", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
            />
          </FilterBar>

          <DataTable
            columns={requestColumns}
            data={filteredRequests}
            isLoading={isLoadingRequests}
            emptyTitle="No access requests"
            emptyDescription="No access requests found matching your criteria."
          />
        </>
      )}

      {/* Direct Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Direct Invite New User"
        description="Provision a direct system account and dispatch an activation link."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. John Doe"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="john.doe@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <Select
            label="Assigned System Role"
            options={[
              { value: "PROJECT_MANAGER", label: "Project Manager" },
              { value: "SITE_ENGINEER", label: "Site Engineer" },
              { value: "STORE_MANAGER", label: "Store Manager" },
              { value: "CONTRACTOR", label: "Contractor" },
              { value: "CLIENT", label: "Client" },
              { value: "ADMIN", label: "Admin" },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingInvite}>
              Create & Invite User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Request Modal */}
      <Modal
        isOpen={!!selectedRequestForApprove}
        onClose={() => {
          setSelectedRequestForApprove(null);
          setGeneratedActivationToken(null);
        }}
        title="Approve Access Request"
        description={`Confirm role authorization for ${selectedRequestForApprove?.email}.`}
      >
        {generatedActivationToken ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Account Created (Pending Activation)
              </div>
              <p className="text-xs text-emerald-700">
                Share this activation token with the user to establish their account password:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={generatedActivationToken}
                  className="w-full font-mono text-xs bg-white border border-emerald-300 rounded px-2.5 py-1.5 text-slate-800"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedActivationToken);
                    showSuccess("Copied", "Activation token copied to clipboard");
                  }}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedRequestForApprove(null);
                  setGeneratedActivationToken(null);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleApproveRequest} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
              <div className="font-semibold text-slate-800">{selectedRequestForApprove?.name}</div>
              <div>Email: {selectedRequestForApprove?.email}</div>
              {selectedRequestForApprove?.organization && (
                <div>Organization: {selectedRequestForApprove.organization}</div>
              )}
              {selectedRequestForApprove?.reason && (
                <div className="italic text-slate-500">"{selectedRequestForApprove.reason}"</div>
              )}
            </div>

            <Select
              label="Assigned System Role (Final Confirmation)"
              options={[
                { value: "PROJECT_MANAGER", label: "Project Manager" },
                { value: "SITE_ENGINEER", label: "Site Engineer" },
                { value: "STORE_MANAGER", label: "Store Manager" },
                { value: "CONTRACTOR", label: "Contractor" },
                { value: "CLIENT", label: "Client" },
                { value: "ADMIN", label: "Admin" },
              ]}
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value as UserRole)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setSelectedRequestForApprove(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isApproving}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Approval & Generate Token
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Request Modal */}
      <Modal
        isOpen={!!selectedRequestForReject}
        onClose={() => setSelectedRequestForReject(null)}
        title="Reject Access Request"
        description={`Specify reason for rejecting access for ${selectedRequestForReject?.email}.`}
      >
        <form onSubmit={handleRejectRequest} className="space-y-4">
          <Textarea
            label="Rejection Reason"
            required
            rows={3}
            placeholder="e.g. Unverified contractor credentials, outside of current project vendor roster..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSelectedRequestForReject(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isRejecting}
              className="bg-rose-600 hover:bg-rose-700"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Deactivate User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUserConfirm}
        title="Deactivate & Remove Account"
        message={
          userToDelete
            ? `Are you sure you want to remove the account for ${userToDelete.name} (${userToDelete.email})? This will deactivate login credentials and safely remove the user from all active project assignments. Historical tasks and audit records will remain intact.`
            : "Are you sure you want to deactivate this user account?"
        }
        confirmLabel="Deactivate & Remove Account"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingUser}
      />
    </div>
  );
};

export default UsersPage;
