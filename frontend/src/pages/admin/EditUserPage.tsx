import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Button } from "../../components/ui/Button.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";
import { userService } from "../../services/userService.js";
import { UserRole } from "../../types/index.js";

const ALL_PERMISSION_KEYS = [
  "USERS_CREATE",
  "USERS_READ",
  "USERS_UPDATE",
  "USERS_DELETE",
  "USERS_MANAGE_ROLES",
  "PROJECTS_CREATE",
  "PROJECTS_READ",
  "PROJECTS_UPDATE",
  "PROJECTS_DELETE",
  "PROJECTS_CHANGE_STATUS",
  "PROJECTS_ASSIGN_MEMBERS",
  "FINANCIAL_VIEW_BUDGET",
  "FINANCIAL_RECORD_EXPENSE",
  "FINANCIAL_APPROVE_EXPENSE",
];

export const EditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryRole, setPrimaryRole] = useState<UserRole>("SITE_ENGINEER");
  const [additionalPermissions, setAdditionalPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    userService
      .getUserById(userId)
      .then((res) => {
        if (res.success && res.data) {
          const u = res.data.user;
          setName(u.name);
          setEmail(u.email);
          setPrimaryRole(u.primaryRole);
          setAdditionalPermissions(u.additionalPermissions || []);
        }
      })
      .catch(() => {
        showError("Error", "Could not load user details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId, showError]);

  const handleTogglePermission = (perm: string) => {
    setAdditionalPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !name) return;

    setIsSaving(true);
    try {
      await userService.updateUser(userId, {
        name,
        primaryRole,
        additionalPermissions,
      });
      showSuccess("User Updated", "Account configuration saved.");
      navigate(`/admin/users/${userId}`);
    } catch (error) {
      showError(
        "Update Failed",
        error instanceof Error ? error.message : "Error updating user."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading user details..." />;
  if (!userId) return <ErrorState title="User Not Found" message="Invalid user id." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to={`/admin/users/${userId}`}
          className="hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to User Profile
        </Link>
      </div>

      <PageHeader
        title={`Edit Profile: ${name}`}
        description={`Modify name, primary role assignment, and granular permission overrides.`}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Account Information">
          <div className="space-y-4">
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email Address"
              disabled
              value={email}
              helperText="Email is locked to primary authentication identity."
            />
            <Select
              label="Primary Organization Role"
              options={[
                { value: "PROJECT_MANAGER", label: "Project Manager" },
                { value: "SITE_ENGINEER", label: "Site Engineer" },
                { value: "STORE_MANAGER", label: "Store Manager" },
                { value: "CONTRACTOR", label: "Contractor" },
                { value: "CLIENT", label: "Client" },
                { value: "ADMIN", label: "Admin (Organization Owner)" },
              ]}
              value={primaryRole}
              onChange={(e) => setPrimaryRole(e.target.value as UserRole)}
            />
          </div>
        </Card>

        <Card title="Additional Permissions Override">
          <p className="text-xs text-slate-500 mb-3">
            Grant specific granular capabilities beyond base primary role.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_PERMISSION_KEYS.map((perm) => {
              const isChecked = additionalPermissions.includes(perm);
              return (
                <label
                  key={perm}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTogglePermission(perm)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>{perm}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to={`/admin/users/${userId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;
