import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ToastContainer } from "../components/ui/Toast.js";
import { HardHat } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle.js";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen app-canvas-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-150 relative overflow-hidden">
      {/* 1. Architectural Blueprint Drafting Grid */}
      <div className="absolute inset-0 blueprint-lines opacity-90 dark:opacity-70 pointer-events-none" aria-hidden="true" />

      {/* 2. Visible 2.5D Construction Truss Beams & Structural Motion (Left & Right Flanks) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Left Structural Steel Column with Lattice Bracing */}
        <div
          className="absolute left-[4%] sm:left-[8%] bottom-0 w-16 sm:w-20 h-[650px] border-l border-r border-brand-500/30 dark:border-brand-400/25 animate-structural-rise-slow"
          style={{ animationDelay: "0s" }}
        >
          <svg className="w-full h-full text-brand-500/25 dark:text-brand-400/20" preserveAspectRatio="none" viewBox="0 0 40 400">
            <path d="M0,0 L40,40 M40,0 L0,40 M0,40 L40,80 M40,40 L0,80 M0,80 L40,120 M40,80 L0,120 M0,120 L40,160 M40,120 L0,160 M0,160 L40,200 M40,160 L0,200 M0,200 L40,240 M40,200 L0,240 M0,240 L40,280 M40,240 L0,280 M0,280 L40,320 M40,280 L0,320 M0,320 L40,360 M40,320 L0,360 M0,360 L40,400 M40,360 L0,400" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          <div className="absolute top-4 left-1.5 text-[9px] font-mono font-bold text-brand-700/60 dark:text-brand-300/50">
            ▲ EL +36.00m
          </div>
        </div>

        {/* Right Structural Steel Column with Lattice Bracing */}
        <div
          className="absolute right-[4%] sm:right-[8%] bottom-0 w-16 sm:w-20 h-[700px] border-l border-r border-slate-400/30 dark:border-slate-600/25 animate-structural-rise-med"
          style={{ animationDelay: "5s" }}
        >
          <svg className="w-full h-full text-slate-400/25 dark:text-slate-500/25" preserveAspectRatio="none" viewBox="0 0 40 400">
            <path d="M0,0 L40,40 M40,0 L0,40 M0,40 L40,80 M40,40 L0,80 M0,80 L40,120 M40,80 L0,120 M0,120 L40,160 M40,120 L0,160 M0,160 L40,200 M40,160 L0,200 M0,200 L40,240 M40,200 L0,240 M0,240 L40,280 M40,240 L0,280 M0,280 L40,320 M40,280 L0,320 M0,320 L40,360 M40,320 L0,360 M0,360 L40,400 M40,360 L0,400" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          <div className="absolute top-8 left-1.5 text-[9px] font-mono font-bold text-slate-600/60 dark:text-slate-400/50">
            ▲ COL C-04
          </div>
        </div>

        {/* Large Architectural Watermark Behind Form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] transform -rotate-6">
          <span className="text-8xl sm:text-[10rem] font-black font-display tracking-tighter uppercase text-slate-900 dark:text-slate-100 whitespace-nowrap block">
            SMART BUILD ERP
          </span>
        </div>
      </div>

      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6 relative z-10">
        <Link to="/login" className="inline-flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-all">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-display block leading-tight">
                Smart Build
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800">
                ERP
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Construction Management Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-elevated transition-all">
          <Outlet />
        </div>
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-medium">&copy; {new Date().getFullYear()} Smart Build ERP. Commercial construction operations standard.</p>
          <div className="flex justify-center items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px] pt-1">
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
