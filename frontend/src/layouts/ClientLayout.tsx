import React from "react";
import { Outlet, Link } from "react-router-dom";
import { LogOut, Phone } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { Button } from "../components/ui/Button.js";
import { ToastContainer } from "../components/ui/Toast.js";

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            SB
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">
              Smart Build Client Portal
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Project Progress & Transparency
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Phone className="w-3.5 h-3.5 text-brand-600" />
            <span>Support: +1 (800) 555-BUILD</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-800">{user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-xs gap-1 py-1 px-2.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
          <span>&copy; {new Date().getFullYear()} Smart Build Construction ERP</span>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-brand-600 hover:underline">
              Internal Workspace
            </Link>
            <span>Confidential & Proprietary</span>
          </div>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
};

export default ClientLayout;
