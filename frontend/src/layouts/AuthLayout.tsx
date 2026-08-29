import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ToastContainer } from "../components/ui/Toast.js";
import { HardHat } from "lucide-react";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6">
        <Link to="/login" className="inline-flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              Smart Build
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Construction Management Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-2xl shadow-card">
          <Outlet />
        </div>
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>&copy; {new Date().getFullYear()} Smart Build ERP. Strict security & RBAC compliance.</p>
          <div className="flex justify-center items-center gap-3 text-slate-400 text-[11px] pt-1">
            <span>Verified Role Access</span>
            <span>&bull;</span>
            <span>Audited Operations</span>
            <span>&bull;</span>
            <span>Project Isolation</span>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AuthLayout;
