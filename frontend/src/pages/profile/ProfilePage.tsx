import React, { useState } from "react";
import { Mail, Key } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { useAuth, usePermissions } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { authService } from "../../services/authService.js";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { effectivePermissions } = usePermissions();
  const { showSuccess, showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Validation Error", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      showError("Validation Error", "New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Validation Error", "New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res.success) {
        showSuccess("Password Updated", "Your account password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError("Error", res.message || "Failed to change password.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to change password.";
      showError("Password Update Failed", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-500">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Account Profile"
        description="Manage your account credentials, security settings, and role permissions."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-16 h-16 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xl mb-3">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
              <div className="mt-3">
                <StatusBadge status={user.primaryRole} />
              </div>
            </div>

            <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Status</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {user.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account ID</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[120px]" title={user.id}>
                  {user.id}
                </span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Login</span>
                  <span className="text-slate-700">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Assigned Permissions Card */}
          <Card title="Effective Permissions" subtitle="Granted by primary role & additions">
            <div className="flex flex-wrap gap-1.5 mt-2">
              {effectivePermissions.length > 0 ? (
                effectivePermissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Standard role access</span>
              )}
            </div>
          </Card>
        </div>

        {/* Change Password / Security Card */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Security & Password" subtitle="Update your password to keep your account secure">
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-2">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-brand-600" />
                  Password Requirements:
                </p>
                <ul className="list-disc list-inside text-slate-500 space-y-0.5 pl-1">
                  <li>Minimum 8 characters in length</li>
                  <li>Must not match your previous password</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
