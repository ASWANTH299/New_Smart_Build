import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderPlus, MapPin, Calendar, Users } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { FilterBar } from "../../components/ui/FilterBar.js";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Select } from "../../components/ui/Select.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { useToast } from "../../hooks/useToast.js";
import { usePermissions } from "../../hooks/useAuth.js";
import { projectService, ProjectDetail } from "../../services/projectService.js";

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { showError } = useToast();
  const { isAdmin, isProjectManager } = usePermissions();

  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await projectService.getProjects({
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch {
      showError("Error", "Unable to load projects directory.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, showError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const canCreateProject = isAdmin || isProjectManager;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects Directory"
        description="Active capital construction projects and operational workspaces."
        actions={
          canCreateProject ? (
            <Link to="/projects/new">
              <Button variant="primary" leftIcon={<FolderPlus className="w-4 h-4" />}>
                Create Project
              </Button>
            </Link>
          ) : undefined
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        placeholder="Search projects by code, title, or location..."
        hasActiveFilters={statusFilter !== "ALL"}
        onClearFilters={() => {
          setStatusFilter("ALL");
          setSearchTerm("");
        }}
      >
        <Select
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "PLANNING", label: "Planning" },
            { value: "ACTIVE", label: "Active" },
            { value: "ON_HOLD", label: "On Hold" },
            { value: "COMPLETED", label: "Completed" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </FilterBar>

      {isLoading ? (
        <LoadingState message="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No Projects Found"
          description="Create your first capital construction project or adjust filters."
          action={
            canCreateProject ? (
              <Link to="/projects/new">
                <Button variant="primary">Create Project</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="block group transition-all duration-200 hover:-translate-y-1"
            >
              <Card className="h-full border-slate-200/80 dark:border-slate-800 hover:border-brand-500/80 dark:hover:border-brand-500/80 hover:shadow-card-hover transition-all">
                <div className="flex flex-col h-full justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 border border-brand-200/60 dark:border-brand-800 px-2 py-0.5 rounded-md">
                        {project.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={project.health} size="sm" />
                        <StatusBadge status={project.status} size="sm" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-base line-clamp-1 transition-colors font-display">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <ProgressIndicator progress={project.progress || 0} size="sm" />

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due {new Date(project.plannedEndDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">PM: <strong className="text-slate-700 dark:text-slate-300">{project.projectManagerId?.name || "Unassigned"}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
