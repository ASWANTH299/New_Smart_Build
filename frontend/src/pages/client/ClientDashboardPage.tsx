import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  RotateCw,
  Maximize2,
  X,
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-zinc-900 dark:text-zinc-100">
      {/* Top Bar: Project Switcher & Refresh */}
      <div className="h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hidden sm:block" />
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            {project?.name || "Client Portal Overview"}
            <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
              {project?.code || "SELECT"}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedProjectId && fetchProjectDetails(selectedProjectId)}
            disabled={loadingDetails}
            className="text-xs h-8 gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingDetails ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      <div className="space-y-8 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">

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
              <div className="lg:col-span-7 space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={project.status} size="sm" />
                  <StatusBadge status={project.health} size="sm" />
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {project.location}
                  </span>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                  {project.description ||
                    "Continuous monitoring and transparent site construction execution managed through Smart Build ERP."}
                </p>

                {/* Handover & Timeline Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                      Planned Start
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Date(project.plannedStartDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                      Target Handover Date
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(project.plannedEndDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                      Schedule Window
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : "On schedule"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Progress Meter */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-r-lg border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 h-full">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Total Construction Progress
                  </span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                    {project.overallCompletionPercentage}%
                  </span>
                </div>

                {/* Progress Bar with Gradient */}
                <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, project.overallCompletionPercentage))}%` }}
                  />
                </div>

                <div className="w-full flex items-center justify-between font-mono text-[10px] font-semibold text-zinc-500 mt-2 uppercase tracking-wider">
                  <span>0% Groundbreaking</span>
                  <span>50% Structure</span>
                  <span>100% Handover</span>
                </div>

                {/* Quality & Inspections Quick Stats */}
                {quality && (
                  <div className="w-full mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Passed Quality Audits</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {quality.passedCheckpoints} of {quality.totalCheckpoints} ({quality.passPercentage}%)
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Pending Inspection</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                Project Milestones
              </h2>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {milestones.filter((m) => m.status === "ACHIEVED").length} / {milestones.length} Completed
              </span>
            </div>

            {milestones.length === 0 ? (
              <EmptyState title="No milestones" description="No client-visible milestones published yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {milestones.map((m, index) => {
                  const isAchieved = m.status === "ACHIEVED";
                  return (
                    <Card key={m.id || index} className="relative flex flex-col justify-between p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
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
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {m.title}
                          </h3>
                          {m.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
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
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                Daily Site Progress
              </h2>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Verified Reports: {dailyProgress.length}
              </span>
            </div>

            {dailyProgress.length === 0 ? (
              <EmptyState title="No Reports" description="No approved site operations reports published yet." />
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
                          className="group relative aspect-4/3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 cursor-pointer hover:border-amber-500 transition-all shadow-xs"
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white font-medium truncate">
                              {item.reportNumber}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="h-6 w-6 rounded-full bg-zinc-900/80 flex items-center justify-center text-white">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {dailyProgress.every((dp) => !dp.photos || dp.photos.length === 0) && (
                    <EmptyState title="No Photos" description="Photos will appear here as daily site inspections and work logs are approved." />
                  )}
                </div>

                {/* Approved Work Logs Column */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Recent Approved Operations
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {dailyProgress.slice(0, 6).map((log) => (
                      <Card
                        key={log.id}
                        className="p-4 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-medium text-amber-600 dark:text-amber-500">
                            {log.reportNumber}
                          </span>
                          <span className="text-zinc-500">
                            {new Date(log.reportDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
                          {log.workPerformed}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            {log.weatherCondition === "RAINY" ? (
                              <CloudRain className="w-3.5 h-3.5" />
                            ) : log.weatherCondition === "CLOUDY" ? (
                              <Cloud className="w-3.5 h-3.5" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            {log.weatherCondition || "Clear"}
                          </span>
                          <StatusBadge status="APPROVED" size="sm" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: Financial Billing / Payment Milestones Card */}
          <section id="financials" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                Financial Milestones
              </h2>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Contract Tranche Summary
              </span>
            </div>

            <Card className="space-y-6 p-6">
              {/* Financial Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="rounded bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                    Planned Contract Value
                  </span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalBudget || 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                    Total Invoiced
                  </span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalBilled || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5 uppercase tracking-wider">
                    {financial?.billedPercentage || 0}% of contract
                  </span>
                </div>

                <div className="rounded bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                    Disbursed & Paid
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {(financial?.totalPaid || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5 uppercase tracking-wider">
                    {financial?.paidPercentage || 0}% confirmed
                  </span>
                </div>

                <div className="rounded bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                    Pending Balance
                  </span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-500 font-mono">
                    {financial?.currency || "USD"}{" "}
                    {Math.max(
                      0,
                      (financial?.totalBudget || 0) - (financial?.totalPaid || 0)
                    ).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5 uppercase tracking-wider">
                    Remaining tranches
                  </span>
                </div>
              </div>

              {/* Billed vs Paid Visual Progress Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium font-mono uppercase tracking-wider text-zinc-500">
                  <span>Milestone Trajectory</span>
                  <span>
                    Paid: <strong className="text-emerald-600 dark:text-emerald-500">{financial?.paidPercentage || 0}%</strong> | Billed:{" "}
                    <strong className="text-amber-600 dark:text-amber-500">{financial?.billedPercentage || 0}%</strong>
                  </span>
                </div>
                <div className="relative w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  {/* Billed indicator (wider) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-amber-500/40 rounded-full transition-all duration-700"
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
                <h4 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Payment Milestones Schedule
                </h4>
                <div className="border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/90 dark:border-zinc-800/80">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-zinc-600 dark:text-zinc-300">Milestone Target</th>
                        <th className="py-2.5 px-4 font-semibold text-zinc-600 dark:text-zinc-300">Scheduled Date</th>
                        <th className="py-2.5 px-4 font-semibold text-zinc-600 dark:text-zinc-300">Tranche Value</th>
                        <th className="py-2.5 px-4 font-semibold text-zinc-600 dark:text-zinc-300">Weight</th>
                        <th className="py-2.5 px-4 font-semibold text-zinc-600 dark:text-zinc-300 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/90 dark:divide-zinc-800/80">
                      {(financial?.paymentMilestones || []).map((pm, idx) => (
                        <tr key={pm.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-2.5 px-4 text-zinc-900 dark:text-zinc-100 font-medium">
                            {pm.title}
                          </td>
                          <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">
                            {new Date(pm.targetDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-zinc-900 dark:text-zinc-100">
                            {financial?.currency || "USD"} {pm.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-zinc-500 font-mono">
                            {pm.percentage}%
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {pm.status === "PAID" ? (
                              <StatusBadge status="PAID" size="sm" />
                            ) : pm.status === "BILLED" ? (
                              <StatusBadge status="PENDING" size="sm" />
                            ) : (
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
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
    </div>
  );
};

export default ClientDashboardPage;
