import React from "react";
import { Outlet, Link } from "react-router-dom";
import {
  LogOut,
  Building2,
  ShieldCheck,
  Calendar,
  Camera,
  Layers,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { Button } from "../components/ui/Button.js";
import { ToastContainer } from "../components/ui/Toast.js";

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const navLinks = [
    { label: "Overview", href: "#overview", icon: Layers },
    { label: "Milestones", href: "#milestones", icon: Calendar },
    { label: "Site Photos", href: "#site-photos", icon: Camera },
    { label: "Billing & Progress", href: "#financials", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Executive Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4">
          {/* Brand & Client Identification */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-base shadow-md shadow-brand-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  Smart Build
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Client Portal
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Executive Transparency & Project Assurance
              </span>
            </div>
          </div>

          {/* Quick Section Navigation Anchor Links */}
          <nav className="hidden md:flex items-center gap-1 border border-slate-800 bg-slate-900/80 rounded-xl p-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-400" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 sm:border-l sm:border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-brand-400 font-medium tracking-wide">
                    Authorized Stakeholder
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-xs gap-1.5 py-1.5 px-3 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Client Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Executive Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Smart Build</span>
            <span>&copy; {new Date().getFullYear()} Construction ERP Inc.</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Strictly Confidential</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
              <span>Project Inquiries: support@smartbuild.com</span>
            </span>
            {user?.primaryRole === "ADMIN" && (
              <Link
                to="/dashboard"
                className="text-brand-400 hover:text-brand-300 hover:underline transition-colors"
              >
                Go to Internal Workspace &rarr;
              </Link>
            )}
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
};

export default ClientLayout;
