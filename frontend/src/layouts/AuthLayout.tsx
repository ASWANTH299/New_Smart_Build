import React from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "../components/ui/Toast.js";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg shadow-sm mb-3">
          SB
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Smart Build
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Construction Management & Operations Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-2xl shadow-card">
          <Outlet />
        </div>
        <div className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Smart Build ERP. Strict security & compliance.
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AuthLayout;
