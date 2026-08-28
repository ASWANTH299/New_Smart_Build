import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, UserCheck, UserX, Shield } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { DataTable } from "../../components/ui/DataTable.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { FilterBar } from "../../components/ui/FilterBar.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { useToast } from "../../hooks/useToast.js";
import { userService } from "../../services/userService.js";
import { User, UserRole } from "../../types/index.js";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("SITE_ENGINEER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole, selectedStatus, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setIsSubmitting(true);
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
      setIsSubmitting(false);
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

  const columns = [
    {
      key: "details",
      header: "User Details",
      accessor: (u: User) => (
        <div className="flex flex-col">
          <Link to={`/admin/users/${u.id}`} className="font-semibold text-slate-900 hover:text-brand-600 hover:underline">
            {u.name}
          </Link>
          <span className="text-xs text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Primary Role",
      accessor: (u: User) => (
        <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700">
          <Shield className="w-3.5 h-3.5 text-brand-600" />
          <span>{u.primaryRole.replace(/_/g, " ")}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (u: User) => <StatusBadge status={u.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (u: User) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/users/${u.id}`}>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
          <Button
            variant={u.status === "ACTIVE" ? "danger" : "secondary"}
            size="sm"
            onClick={() => handleToggleStatus(u)}
            title={u.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
          >
            {u.status === "ACTIVE" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Organization Directory"
        description="Manage system users, primary roles, permissions, and project assignments."
        actions={
          <Button variant="primary" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsInviteModalOpen(true)}>
            Invite User
          </Button>
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        placeholder="Search users by name or email..."
        hasActiveFilters={selectedRole !== "ALL" || selectedStatus !== "ALL"}
        onClearFilters={() => {
          setSelectedRole("ALL");
          setSelectedStatus("ALL");
          setSearchTerm("");
        }}
      >
        <div className="flex gap-2">
          <Select
            options={[
              { value: "ALL", label: "All Roles" },
              { value: "ADMIN", label: "Admin" },
              { value: "PROJECT_MANAGER", label: "Project Manager" },
              { value: "SITE_ENGINEER", label: "Site Engineer" },
              { value: "STORE_MANAGER", label: "Store Manager" },
              { value: "CONTRACTOR", label: "Contractor" },
              { value: "CLIENT", label: "Client" },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
          <Select
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "DEACTIVATED", label: "Deactivated" },
              { value: "PENDING_ACTIVATION", label: "Pending Activation" },
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyTitle="No users matching directory criteria."
      />

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Onboard New Team Member"
        description="Send an invitation with primary role assignment."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Ramesh Chandra"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="ramesh@smartbuild.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <Select
            label="Primary Role"
            options={[
              { value: "PROJECT_MANAGER", label: "Project Manager" },
              { value: "SITE_ENGINEER", label: "Site Engineer" },
              { value: "STORE_MANAGER", label: "Store Manager" },
              { value: "CONTRACTOR", label: "Contractor" },
              { value: "CLIENT", label: "Client" },
              { value: "ADMIN", label: "Admin (Organization Owner)" },
            ]}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create & Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
