import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Validation Error", "Please provide your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        const defaultTarget =
          response.data.user.primaryRole === "CLIENT" ? "/client-portal" : "/dashboard";
        const from =
          (location.state as { from?: { pathname: string } })?.from?.pathname || defaultTarget;
        navigate(from, { replace: true });
      } else {
        showError("Authentication Failed", response.message || "Invalid credentials.");
      }
    } catch (error) {
      showError(
        "Sign In Failed",
        error instanceof Error ? error.message : "Unable to authenticate at this time."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Sign In to Your Workspace</h3>
        <p className="text-xs text-slate-500">Enter your credentials to access project operations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="engineer@smartbuild.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to="/forgot-password"
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Forgot Password?
          </Link>
          <Link
            to="/activate-account"
            className="font-medium text-slate-500 hover:text-slate-700 hover:underline"
          >
            Activate Account
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 mt-4">
          <span>Don't have an account? </span>
          <Link
            to="/request-access"
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Request Access
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
