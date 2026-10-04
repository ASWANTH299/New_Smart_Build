import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart3,
  Download,
  Printer,
  DollarSign,
  AlertTriangle,
  Users,
  CheckCircle2,
  ShieldAlert,
  Flame,
  FileText,
  Package,
  RefreshCw,
} from "lucide-react";
import { reportService } from "../../services/reportService.js";
import { ProjectAnalytics } from "../../types/report.js";
import { useToast } from "../../hooks/useToast.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Metric } from "../../components/ui/Metric.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";

export const ProjectReportsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { showSuccess, showError } = useToast();

  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getProjectAnalytics(projectId);
      setAnalytics(res.data);
    } catch (err: any) {
      console.error("Failed to load project reports:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load project analytics");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async (format: "csv" | "json") => {
    if (!projectId) return;
    try {
      setExporting(format);
      await reportService.exportProjectReport(projectId, format);
      showSuccess(`Project summary exported successfully as ${format.toUpperCase()}`);
    } catch (err: any) {
      showError(err?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingState message="Generating real-time project analytics & reports..." />;
  }

  if (error || !analytics) {
    return (
      <ErrorState
        message={error || "Failed to generate report"}
        onRetry={fetchAnalytics}
      />
    );
  }

  const { project, progress, milestones, budget, workforce, issues } = analytics;

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Executive Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
            {project.name} Reports
          </h1>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {project.code}
          </span>
          <StatusBadge status={project.status} size="sm" />
          <StatusBadge status={project.health} size="sm" />
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchAnalytics}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            isLoading={exporting === "csv"}
            onClick={() => handleExport("csv")}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm overflow-x-auto print:hidden">
        <Link
          to={`/projects/${projectId}/daily-reports`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <FileText className="w-4 h-4" /> Daily Site Reports
        </Link>
        <Link
          to={`/projects/${projectId}/issues`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <AlertTriangle className="w-4 h-4" /> Site Issues
        </Link>
        <Link
          to={`/projects/${projectId}/budget`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <DollarSign className="w-4 h-4" /> Budget & Ledger
        </Link>
        <Link
          to={`/projects/${projectId}/workforce`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <Users className="w-4 h-4" /> Workforce
        </Link>
        <Link
          to={`/projects/${projectId}/reports`}
          className="font-semibold border-b-2 border-amber-500 text-zinc-900 dark:text-white pb-2 -mb-2.5 flex items-center gap-1.5 shrink-0"
        >
          <BarChart3 className="w-4 h-4" /> Reports & Analytics
        </Link>
      </div>

      {/* 4 Analytical KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Metric
          label="Milestone Health"
          value={`${milestones.milestoneHealth}%`}
          subtext={`${milestones.achievedMilestones} of ${milestones.totalMilestones} achieved`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <Metric
          label="Budget Burn Rate"
          value={`${budget.burnRate}%`}
          subtext={`$${budget.totalActual.toLocaleString()} spent of $${budget.totalPlanned.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
        />
        <Metric
          label="Avg Daily Headcount"
          value={workforce.averageAttendance}
          subtext={`${workforce.totalWorkers} assigned personnel`}
          icon={<Users className="w-5 h-5 text-indigo-500" />}
        />
        <Metric
          label="Active Site Hazards"
          value={issues.openIssues + issues.inProgressIssues}
          subtext={`${issues.criticalHazardCount} critical priority hazards`}
          icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Visual Progress & Cost Variance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule & Progress Card */}
        <Card title="Construction Progress & Milestone Execution" className="lg:col-span-6">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Overall Completion Progress
                </span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {progress.overallProgress}%
                </span>
              </div>
              <ProgressIndicator progress={progress.overallProgress} size="md" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {progress.completedTasks}
                </span>
                <span className="text-[10px] text-zinc-400 block">Tasks finished</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  In Progress
                </span>
                <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                  {progress.inProgressTasks}
                </span>
                <span className="text-[10px] text-zinc-400 block">Active tasks</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Delayed
                </span>
                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {progress.delayedTasks}
                </span>
                <span className="text-[10px] text-zinc-400 block">Behind deadline</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Blocked
                </span>
                <span className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {progress.blockedTasks}
                </span>
                <span className="text-[10px] text-zinc-400 block">Needs resolution</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Phases Completed:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {progress.completedPhases} of {progress.totalPhases} Phases (
                {progress.totalPhases > 0
                  ? Math.round((progress.completedPhases / progress.totalPhases) * 100)
                  : 0}
                %)
              </span>
            </div>
          </div>
        </Card>

        {/* Financial & Cost Variance Card */}
        <Card title="Cost Variance & Category Allocations" className="lg:col-span-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 pb-2 text-center border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                  Total Planned
                </span>
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  ${budget.totalPlanned.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                  Actual Spent
                </span>
                <span className="text-base font-bold font-mono text-brand-600 dark:text-brand-400">
                  ${budget.totalActual.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                  Remaining Balance
                </span>
                <span
                  className={`text-base font-bold font-mono ${
                    budget.remainingBalance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  ${budget.remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Category Comparison Bars */}
            <div className="space-y-3">
              {budget.categoryBreakdown.length > 0 ? (
                budget.categoryBreakdown.map((cat, idx) => {
                  const maxAmount = Math.max(cat.planned, cat.actual, 1);
                  const plannedPct = Math.min(100, Math.round((cat.planned / maxAmount) * 100));
                  const actualPct = Math.min(100, Math.round((cat.actual / maxAmount) * 100));
                  const isOver = cat.actual > cat.planned && cat.planned > 0;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-zinc-500">
                            Act: ${cat.actual.toLocaleString()}
                          </span>
                          <span className="text-zinc-400">/</span>
                          <span className="text-zinc-500">
                            Plan: ${cat.planned.toLocaleString()}
                          </span>
                          <span
                            className={`font-semibold ${
                              isOver ? "text-red-500" : "text-emerald-500"
                            }`}
                          >
                            ({cat.variance >= 0 ? "+" : ""}
                            ${cat.variance.toLocaleString()})
                          </span>
                        </div>
                      </div>

                      {/* Dual comparison bar */}
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                        <div
                          className="h-full bg-zinc-300 dark:bg-zinc-600 absolute top-0 left-0 rounded-full opacity-60"
                          style={{ width: `${plannedPct}%` }}
                        />
                        <div
                          className={`h-full absolute top-0 left-0 rounded-full ${
                            isOver ? "bg-red-500" : "bg-brand-500"
                          }`}
                          style={{ width: `${actualPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 italic py-4 text-center">
                  No budget categories defined yet.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Task & Issue Distribution Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues & Hazard Mitigation Summary */}
        <Card title="Site Hazards & Quality Snag Status">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-xs text-amber-700 dark:text-amber-300 uppercase block font-semibold">
                  Open
                </span>
                <span className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100">
                  {issues.openIssues}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-700 dark:text-blue-300 uppercase block font-semibold">
                  In Progress
                </span>
                <span className="text-xl font-bold font-mono text-blue-900 dark:text-blue-100">
                  {issues.inProgressIssues}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 uppercase block font-semibold">
                  Resolved
                </span>
                <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100">
                  {issues.resolvedIssues}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 uppercase block font-semibold">
                  Closed
                </span>
                <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {issues.closedIssues}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                  <Flame className="w-4 h-4 text-red-500" /> Critical Severity Hazards:
                </span>
                <span className="font-bold font-mono text-red-600 dark:text-red-400">
                  {issues.criticalHazardCount} Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> High Priority Items:
                </span>
                <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  {issues.highPriorityCount} Active
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Resources & Workforce Operational Summary */}
        <Card title="Materials Procurement & Workforce Activity">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    BOM Material Spec
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Items:</span>
                    <span className="font-bold font-mono">{analytics.materials.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Shortage / Low Stock:</span>
                    <span
                      className={`font-bold font-mono ${
                        analytics.materials.lowStockCount > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {analytics.materials.lowStockCount} items
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Workforce Attendance
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Assigned Workers:</span>
                    <span className="font-bold font-mono">{workforce.totalWorkers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Present Today:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {workforce.presentToday}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>Report Generated On:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectReportsPage;
