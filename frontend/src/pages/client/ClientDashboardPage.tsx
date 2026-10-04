import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  DollarSign,
  ShieldCheck,
  RotateCw,
  Maximize2,
  X,
  FileCheck2,
  Sun,
  CloudRain,
  Cloud,
} from "lucide-react";
import { clientService } from "../../services/clientService.js";
import {
  ClientProjectMetadata,
  ClientProjectDetailsResponse,
} from "../../types/client.js";
import { Button } from "../../components/ui/Button.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { Card } from "../../components/ui/Card.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";

export const ClientDashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<ClientProjectMetadata[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [details, setDetails] = useState<ClientProjectDetailsResponse | null>(null);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Load projects accessible to this client
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const response = await clientService.getClientProjects();
      if (response.success && response.data) {
        setProjects(response.data);
        if (response.data && response.data.length > 0) {
          setSelectedProjectId((prev) => prev || response.data![0].id);
        }
      } else {
        setError(response.message || "Failed to load projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to client service");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load details for the selected project
  const fetchProjectDetails = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setLoadingDetails(true);
    try {
      const response = await clientService.getClientProjectDetails(projectId);
      if (response.success && response.data) {
        setDetails(response.data);
      } else {
        setError(response.message || "Failed to load project details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading project details");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectDetails]);

  if (loadingProjects) {
    return (
      <div className="py-20">
        <LoadingState message="Connecting to client portal workspace..." />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="py-16">
        <ErrorState
          title="Unable to Access Client Workspace"
          message={error}
          onRetry={fetchProjects}
        />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          title="No Assigned Projects Found"
          description="Your account is not currently assigned to any active projects. Please contact your Project Manager or Smart Build Administrator for access."
          action={<Button onClick={fetchProjects}>Refresh Workspace</Button>}
        />
      </div>
    );
  }

  const project = details?.project;
  const milestones = details?.milestones || [];
  const dailyProgress = details?.dailySiteProgress || [];
  const quality = details?.qualityInspectionSummary;
  const financial = details?.financialSummary;

  // Calculate days remaining to handover
  let daysRemaining: number | null = null;
  if (project?.plannedEndDate) {
    const end = new Date(project.plannedEndDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    daysRemaining = diff > 0 ? diff : 0;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar: Project Switcher & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Client Engagement
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {project?.code || "SELECT"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {project?.name || "Client Portal Overview"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="project-select" className="text-xs text-slate-400 font-medium">
                Switch Project:
              </label>
              <select
                id="project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedProjectId && fetchProjectDetails(selectedProjectId)}
            disabled={loadingDetails}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingDetails ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {loadingDetails ? (
        <div className="py-20">
          <LoadingState message="Retrieving latest curated project updates..." />
        </div>
      ) : details && project ? (
        <>
          {/* SECTION 1: Project Summary Banner with Live % Completion and Handover Date */}
          <section id="overview">
            <Card className="relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Project Overview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {project.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                    Health: {project.health}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {project.location}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {project.description ||
                    "Continuous monitoring and transparent site construction execution managed through Smart Build ERP."}
                </p>

                {/* Handover & Timeline Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Planned Start
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {new Date(project.plannedStartDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Target Handover Date
                    </span>
                    <span className="text-xs font-semibold text-white flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      {new Date(project.plannedEndDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Schedule Window
                    </span>
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : "On schedule"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Progress Meter */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-slate-800 bg-slate-950/60 backdrop-blur-xs">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Construction Progress
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {project.overallCompletionPercentage}%
                  </span>
                </div>

                {/* Progress Bar with Gradient */}
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, project.overallCompletionPercentage))}%` }}
                  />
                </div>

                <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>0% Groundbreaking</span>
                  <span>50% Structure</span>
                  <span>100% Handover</span>
                </div>

                {/* Quality & Inspections Quick Stats */}
                {quality && (
                  <div className="w-full mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Passed Quality Audits</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {quality.passedCheckpoints} of {quality.totalCheckpoints} ({quality.passPercentage}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Pending Inspection</span>
                      <span className="text-sm font-bold text-amber-400">
                        {quality.pendingCheckpoints} Checkpoints
                      </span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </Card>
          </section>

          {/* SECTION 2: Milestones Progress Cards with Visual Timeline/Checkmarks */}
          <section id="milestones" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Project Milestones & Key Handovers
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {milestones.filter((m) => m.status === "ACHIEVED").length} of {milestones.length} Completed
              </span>
            </div>

            {milestones.length === 0 ? (
              <EmptyState title="No milestones" description="No client-visible milestones published yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {milestones.map((m, index) => {
                  const isAchieved = m.status === "ACHIEVED";
                  return (
                    <Card key={m.id || index} className="relative flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                            Stage {index + 1}
                          </span>
                          {isAchieved ? (
                            <StatusBadge status="COMPLETED" size="sm" />
                          ) : (
                            <StatusBadge status="PENDING" size="sm" />
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-brand-300">
                            {m.title}
                          </h3>
                          {m.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {m.actualDate
                            ? `Completed: ${new Date(m.actualDate).toLocaleDateString()}`
                            : `Target: ${new Date(m.targetDate).toLocaleDateString()}`}
                        </span>
                        <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                          {m.completionPercentage}%
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 3: Site Progress Photo Gallery & Approved Work Logs */}
          <section id="site-photos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Approved Daily Site Progress & Photos
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Verified Field Reports ({dailyProgress.length})
              </span>
            </div>

            {dailyProgress.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                No approved site operations reports published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Photo Gallery Grid */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {dailyProgress
                      .flatMap((dp) =>
                        (dp.photos || []).map((photoUrl, photoIdx) => ({
                          url: photoUrl,
                          reportNumber: dp.reportNumber,
                          date: dp.reportDate,
                          workPerformed: dp.workPerformed,
                          id: `${dp.id}-${photoIdx}`,
                        }))
                      )
                      .slice(0, 12)
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setPreviewPhoto(item.url)}
                          className="group relative aspect-4/3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 cursor-pointer hover:border-brand-500 transition-all shadow-xs"
                        >
                          <img
                            src={item.url}
                            alt={`Site Photo ${item.reportNumber}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              // Fallback display if URL is placeholder
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white font-medium truncate">
                              {item.reportNumber}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="h-6 w-6 rounded-full bg-slate-900/80 flex items-center justify-center text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {dailyProgress.every((dp) => !dp.photos || dp.photos.length === 0) && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                      Photos will appear here as daily site inspections and work logs are approved.
                    </div>
                  )}
                </div>

                {/* Approved Work Logs Column */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Recent Approved Operations
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {dailyProgress.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-medium text-brand-400">
                            {log.reportNumber}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.reportDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                          {log.workPerformed}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {log.weatherCondition === "RAINY" ? (
                              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                            ) : log.weatherCondition === "CLOUDY" ? (
                              <Cloud className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            {log.weatherCondition || "Clear"}
                          </span>
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <FileCheck2 className="w-3 h-3" />
                            Approved DPR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: Financial Billing / Payment Milestones Card */}
          <section id="financials" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Financial Billing & Payment Milestones
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Contract Tranche Summary
              </span>
            </div>

            <Card className="space-y-6">
              {/* Financial Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Planned Contract Value
                  </span>
                  <span className="text-lg font-bold text-white font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalBudget || 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Total Invoiced / Billed
                  </span>
                  <span className="text-lg font-bold text-brand-400 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalBilled || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {financial?.billedPercentage || 0}% of contract
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Disbursed & Paid
                  </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalPaid || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {financial?.paidPercentage || 0}% confirmed
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Pending Tranche Balance
                  </span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {Math.max(
                      0,
                      (financial?.totalBudget || 0) - (financial?.totalPaid || 0)
                    ).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Remaining tranches
                  </span>
                </div>
              </div>

              {/* Billed vs Paid Visual Progress Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-300">Milestone Payment Trajectory</span>
                  <span className="text-slate-400">
                    Paid: <strong className="text-emerald-400">{financial?.paidPercentage || 0}%</strong> | Billed:{" "}
                    <strong className="text-brand-400">{financial?.billedPercentage || 0}%</strong>
                  </span>
                </div>
                <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  {/* Billed indicator (wider) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-brand-500/40 rounded-full transition-all duration-700"
                    style={{ width: `${financial?.billedPercentage || 0}%` }}
                  />
                  {/* Paid indicator (solid) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${financial?.paidPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Tranche Breakdown Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Payment Milestones Schedule
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Milestone Target</th>
                        <th className="py-2.5 px-4 font-medium">Scheduled Date</th>
                        <th className="py-2.5 px-4 font-medium">Tranche Value</th>
                        <th className="py-2.5 px-4 font-medium">Weight</th>
                        <th className="py-2.5 px-4 font-medium text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(financial?.paymentMilestones || []).map((pm, idx) => (
                        <tr key={pm.id || idx} className="hover:bg-slate-900/50">
                          <td className="py-3 px-4 text-white font-semibold flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand-400" />
                            {pm.title}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(pm.targetDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-200">
                            {financial?.currency || "USD"} {pm.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            {pm.percentage}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pm.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Disbursed
                              </span>
                            ) : pm.status === "BILLED" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 text-[11px] font-semibold text-brand-400">
                                <Clock className="w-3 h-3" />
                                Invoiced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                                Upcoming
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </section>
        </>
      ) : null}

      {/* Photo Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhoto}
              alt="Site inspection enlargement"
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboardPage;
