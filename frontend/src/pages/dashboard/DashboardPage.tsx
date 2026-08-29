import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Metric } from "../../components/ui/Metric.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { useAuth, usePermissions } from "../../hooks/useAuth.js";
import { projectService, ProjectDetail } from "../../services/projectService.js";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isProjectManager } = usePermissions();
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const res = await projectService.getProjects({ limit: 10 });
        if (isMounted && res.success && res.data) {
          setProjects(res.data);
        }
      } catch {
        // Fallback gracefully on network/unauthenticated
        if (isMounted) {
          setProjects([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const healthyProjects = projects.filter((p) => p.health === "HEALTHY");
  const atRiskProjects = projects.filter((p) => p.health === "AT_RISK" || p.health === "CRITICAL");
  const avgProgress =
    activeProjects.length > 0
      ? Math.round(
          activeProjects.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
            activeProjects.length
        )
      : 0;

  const canCreateProject = isAdmin || isProjectManager;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description={`Welcome, ${user?.name || "Team Member"}. Construction operations overview and active workspace status.`}
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/projects">
              <Button variant="outline" size="sm" leftIcon={<FolderKanban className="w-4 h-4" />}>
                View All Projects
              </Button>
            </Link>
            {canCreateProject && (
              <Link to="/projects/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  New Project
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Real Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label="Total Projects"
          value={isLoading ? "..." : totalProjects}
          subtext="Assigned construction workspaces"
          icon={<FolderKanban className="w-5 h-5" />}
        />
        <Metric
          label="Active Projects"
          value={isLoading ? "..." : activeProjects.length}
          subtext="Currently in active execution"
          icon={<Activity className="w-5 h-5" />}
        />
        <Metric
          label="Average Progress"
          value={isLoading ? "..." : `${avgProgress}%`}
          subtext="Active projects weighted average"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <Metric
          label="Project Health"
          value={isLoading ? "..." : `${healthyProjects.length} Healthy`}
          subtext={atRiskProjects.length > 0 ? `${atRiskProjects.length} At Risk / Critical` : "All schedules on track"}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Active Projects Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Active Construction Projects"
            subtitle="Quantity-based tracking & schedule progression"
            action={
              <Link
                to="/projects"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 inline-flex items-center gap-1 font-display"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {isLoading ? (
              <LoadingState message="Loading projects..." />
            ) : projects.length === 0 ? (
              <EmptyState
                title="No Construction Projects Found"
                description={
                  canCreateProject
                    ? "Get started by creating your first construction project to begin tracking progress and milestones."
                    : "You do not have any active project assignments yet."
                }
                action={
                  canCreateProject ? (
                    <Link to="/projects/new">
                      <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                        Create Project
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                            {project.code}
                          </span>
                          <Link
                            to={`/projects/${project._id}`}
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 font-display transition-colors"
                          >
                            {project.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {project.location}
                          </span>
                          {project.plannedEndDate && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              Target: {new Date(project.plannedEndDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0 shrink-0">
                        <StatusBadge status={project.health} size="sm" />
                        <StatusBadge status={project.status} size="sm" />
                      </div>
                    </div>

                    <ProgressIndicator
                      progress={project.progress || 0}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Phase 6/7 Operational Intelligence Card */}
        <div className="space-y-4">
          <Card
            title="Operational Readiness"
            subtitle="Platform roadmap & capability status"
          >
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 font-display">
                  <span>Project & Team Foundation</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] border border-emerald-200/60 dark:border-emerald-800">
                    Phase 6 Active
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  User management, RBAC authorization, and project memberships are verified.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 font-display">
                  <span>Progress & Milestone Tracking</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] border border-emerald-200/60 dark:border-emerald-800">
                    Phase 7 Active
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Quantity progress logging, hierarchical rollups, and rule-based health intelligence active.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300 font-display">
                  <span>Materials & Supply Chain</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Phase 8 Next
                  </span>
                </div>
                <p className="text-amber-800/80 dark:text-amber-400/80 text-[11px] leading-relaxed">
                  Material catalog, inventory registers, and site GRN workflows scheduled for Phase 8.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
