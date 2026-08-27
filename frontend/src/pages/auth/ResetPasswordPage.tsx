import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2 } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showError("Validation Error", "Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Validation Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Set New Password</h3>
        <p className="text-xs text-slate-500">
          Ensure your password contains at least 8 characters
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center space-y-4 py-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            Your password has been updated successfully.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate("/login")}>
            Sign In Now
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-900">
              Cancel and return to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
