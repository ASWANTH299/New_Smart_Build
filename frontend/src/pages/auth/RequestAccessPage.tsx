import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, ArrowLeft, CheckCircle2, ShieldAlert, User, Mail, Building, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import authService from "../../services/authService.js";

export const RequestAccessPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState("SITE_ENGINEER");
  const [organization, setOrganization] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showError("Validation Error", "Please provide your full name and email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestAccess({
        name: name.trim(),
        email: email.trim(),
        requestedRole,
        organization: organization.trim() || undefined,
        reason: reason.trim() || undefined,
      });

      if (res.success) {
        setIsSubmitted(true);
      } else {
        showError("Request Failed", res.message || "Failed to submit access request.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit access request.";
      showError("Submission Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100 mb-1">
          <UserCheck className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Request Platform Access</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Submit your details to request access to project operations and site records
        </p>
      </div>

      {/* 5-Step Workflow Visualizer */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 text-center">
          Onboarding Lifecycle
        </p>
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 px-1 overflow-x-auto">
          <span className="text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200/60">
            1. Request
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>2. Review</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>3. Approval</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>4. Activation</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>5. Login</span>
        </div>
      </div>

      {isSubmitted ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Access Request Submitted</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your request for <span className="font-semibold text-slate-900">{email}</span> has been dispatched to the System Administrator for role assignment and verification.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700">What happens next?</p>
            <p>Once an administrator reviews and approves your request, you will receive an activation code to set your secure password and access your workspace.</p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Informational notice */}
          <div className="p-3 bg-brand-50/70 rounded-lg border border-brand-100 flex items-start gap-2.5 text-xs text-brand-900">
            <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Smart Build enforces verified access. Public registration is reviewed before role credentials and project permissions are granted.
            </p>
          </div>

          <Input
            label="Full Name"
            placeholder="e.g. Rajesh Kumar"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
          />

          <Input
            label="Work Email Address"
            type="email"
            placeholder="engineer@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Select
            label="Requested Operational Role"
            options={[
              { value: "SITE_ENGINEER", label: "Site Engineer (Field Operations & Progress Logs)" },
              { value: "PROJECT_MANAGER", label: "Project Manager (Scheduling & Team Oversight)" },
              { value: "STORE_MANAGER", label: "Store Manager (Materials & Warehouse Inventory)" },
              { value: "CONTRACTOR", label: "Contractor / Vendor (Subcontractor Execution)" },
              { value: "CLIENT", label: "Client Representative (Milestone & Progress Transparency)" },
            ]}
            value={requestedRole}
            onChange={(e) => setRequestedRole(e.target.value)}
            helperText="Admin assigns final verified role upon review"
          />

          <Input
            label="Organization / Contracting Firm (Optional)"
            placeholder="e.g. Metro Civil Infra Ltd"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            leftIcon={<Building className="w-4 h-4" />}
          />

          <Textarea
            label="Purpose / Project Scope (Optional)"
            placeholder="State which project site, package, or responsibilities you are assigned to..."
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Submit Access Request
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

export default RequestAccessPage;
