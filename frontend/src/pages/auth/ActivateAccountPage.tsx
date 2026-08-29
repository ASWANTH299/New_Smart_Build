import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, CheckCircle2, ArrowLeft, ShieldCheck, Lock, Check, X } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const ActivateAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      showError("Validation Error", "Activation token is required.");
      return;
    }

    if (!hasMinLength) {
      showError("Validation Error", "Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      showError("Validation Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.activateAccount(token.trim(), password);
      if (res.success) {
        setIsActivated(true);
        showSuccess("Account Activated", "Your account is now ready for operations.");
      } else {
        showError("Activation Failed", res.message || "Failed to activate account. Token may be invalid or expired.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to activate account. Token may be expired.";
      showError("Activation Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
          <KeyRound className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Activate Your Account</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Establish your secure password to begin accessing your assigned workspace
        </p>
      </div>

      {isActivated ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Account Successfully Activated</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your password has been configured and your role-based credentials are active. You may now log in to access your project workspace.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Approval Notice */}
          <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-950">Your access request has been approved</p>
              <p className="text-emerald-800 leading-relaxed">
                Enter your single-use activation code and configure your permanent password below.
              </p>
            </div>
          </div>

          <Input
            label="Activation Token / Code"
            placeholder="Paste your activation code"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            autoComplete="off"
          />

          <Input
            label="Create New Password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your new password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />

          {/* Password Requirements Live Checklist */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
              Password Requirements
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}>
                  At least 8 characters in length
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={passwordsMatch ? "text-emerald-700 font-medium" : "text-slate-500"}>
                  Passwords match
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Activate Account & Set Password
            </Button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-600 hover:text-brand-600 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ActivateAccountPage;
