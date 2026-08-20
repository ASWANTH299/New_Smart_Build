import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Building2, ShieldCheck, Layers, ArrowRight } from "lucide-react";

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Header Navigation Shell */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-600 rounded-lg text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">Smart Build</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  V1 Baseline
                </span>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors"
              >
                Overview
              </Link>
              <Link
                to="/status"
                className="text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors"
              >
                System Status
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Routes>
            <Route
              path="/"
              element={
                <div className="space-y-8">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-card">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Phase 1 Repository & Development Foundation Active
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Construction Project & Resource Management
                    </h1>
                    <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed text-sm sm:text-base">
                      Smart Build centralizes multi-project construction operations across planning,
                      quantity-based progress, material logistics, procurement, workforce, equipment,
                      budgets, and client transparency.
                    </p>
                  </div>

                  {/* Architecture Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h2 className="font-semibold text-slate-900">Frontend Foundation</h2>
                      <p className="text-sm text-slate-600 mt-2">
                        React, TypeScript strict mode, Vite, Tailwind CSS tokens, and React Router v6 ready.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h2 className="font-semibold text-slate-900">Backend Foundation</h2>
                      <p className="text-sm text-slate-600 mt-2">
                        Node.js, Express, TypeScript strict mode, modular structure, and security headers configured.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h2 className="font-semibold text-slate-900">Security & Isolation</h2>
                      <p className="text-sm text-slate-600 mt-2">
                        Clean environment variable configuration, zero hardcoded ports or secrets, Git hygiene enforced.
                      </p>
                    </div>
                  </div>
                </div>
              }
            />
            <Route
              path="/status"
              element={
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-card">
                  <h1 className="text-xl font-bold text-slate-900">System Baseline Status</h1>
                  <p className="text-sm text-slate-600 mt-2">
                    Phase 1 development environment initialized and validated across workspaces.
                  </p>
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <Link
                      to="/"
                      className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Return to Overview <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
            Smart Build V1 — Internal Engineering Baseline
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
