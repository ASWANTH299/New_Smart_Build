import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { UserRole } from "../../types/index.js";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("PROJECT_MANAGER");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Validation Error", "Please provide your email and password.");
      return;
    }

    setIsLoading(true);
    // Phase 3 placeholder auth flow (Phase 4 connects to real backend JWT endpoint)
    setTimeout(() => {
      setIsLoading(false);
      login("dummy_jwt_token_for_phase_3_shell", {
        id: "usr-001",
        name: email.split("@")[0].toUpperCase() || "Operations User",
        email,
        primaryRole: selectedRole,
        additionalPermissions: [],
        status: "ACTIVE",
      });
      showSuccess("Welcome Back", "Logged into Smart Build Workspace");
      navigate("/dashboard");
    }, 400);
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
        />

        <Input
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
        />

        {/* Phase 3 Role Preview Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace Role (Phase 3 Shell Preview)
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
          >
            <option value="ADMIN">ADMIN (Full Access)</option>
            <option value="PROJECT_MANAGER">PROJECT_MANAGER (PM Suite)</option>
            <option value="SITE_ENGINEER">SITE_ENGINEER (Field Operations)</option>
            <option value="STORE_MANAGER">STORE_MANAGER (Inventory)</option>
            <option value="CONTRACTOR">CONTRACTOR (Work Orders)</option>
            <option value="CLIENT">CLIENT (Portal View)</option>
          </select>
        </div>

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
      </form>
    </div>
  );
};

export default LoginPage;
