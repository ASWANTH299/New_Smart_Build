import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      showSuccess("Instructions Dispatched", "Password reset instructions have been generated.");
    } catch (error) {
      showError(
        "Request Failed",
        error instanceof Error ? error.message : "Unable to request password reset."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Reset Your Password</h3>
        <p className="text-xs text-slate-500">
          Enter your registered work email to receive password reset instructions
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center space-y-4 py-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a secure password reset link has been dispatched.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email Address"
            type="email"
            required
            placeholder="engineer@smartbuild.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
