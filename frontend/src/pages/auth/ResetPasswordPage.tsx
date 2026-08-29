import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle2, KeyRound } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showError("Validation Error", "Reset token is required.");
      return;
    }
    if (password.length < 8) {
      showError("Validation Error", "Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Validation Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
      showSuccess("Password Reset", "Your password has been updated successfully.");
    } catch (error) {
      showError(
        "Reset Failed",
        error instanceof Error ? error.message : "Unable to reset password. Token may be expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set New Password</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ensure your password contains at least 8 characters
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center space-y-4 py-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            Your password has been updated successfully.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate("/login")}>
            Sign In Now
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!searchParams.get("token") && (
            <Input
              label="Reset Token"
              type="text"
              required
              placeholder="Paste the reset token from your email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
            />
          )}

          <Input
            label="New Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Minimum 8 characters with letters and numbers"
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Update Password
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Cancel and return to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
