import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, UserCheck } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const ActivateAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activationCode, setActivationCode] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode) {
      showError("Validation Error", "Please provide your activation code from your invite email.");
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
      await authService.activateAccount(activationCode, password);
      showSuccess("Account Activated", "Your account is active. You may now log in.");
      navigate("/login");
    } catch (error) {
      showError(
        "Activation Failed",
        error instanceof Error ? error.message : "Unable to activate account. Code may be invalid or expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Activate Your Account</h3>
        <p className="text-xs text-slate-500">
          Set your initial password using the invitation code provided by your administrator
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!searchParams.get("token") && (
          <Input
            label="Activation Code"
            type="text"
            required
            placeholder="e.g. ACT-98421 or invitation token"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            leftIcon={<UserCheck className="w-4 h-4" />}
          />
        )}

        <Input
          label="Set Password"
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
          Activate Account & Set Password
        </Button>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-900">
            Already activated? Return to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ActivateAccountPage;
