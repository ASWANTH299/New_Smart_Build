import React, { useEffect, useState } from "react";
import { ChevronDown, FolderKanban, Check } from "lucide-react";
import { useProjectContext } from "../hooks/useProjectContext.js";
import { projectService, ProjectDetail } from "../services/projectService.js";
import { StatusBadge } from "./ui/StatusBadge.js";
import { cn } from "../utils/cn.js";

export const ProjectSwitcher: React.FC = () => {
  const { activeProject, setActiveProject } = useProjectContext();
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    projectService
      .getProjects({ limit: 50 })
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setProjects(res.data);
          if (!activeProject && res.data.length > 0) {
            const first = res.data[0];
            setActiveProject({
              id: first._id,
              code: first.code,
              name: first.name,
              status: first.status,
              health: first.health,
              progress: first.progress,
            });
          }
        }
      })
      .catch(() => {
        // Silently handle fallback
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveProject]);

  const handleSelect = (p: ProjectDetail) => {
    setActiveProject({
      id: p._id,
      code: p.code,
      name: p.name,
      status: p.status,
      health: p.health,
      progress: p.progress,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs group"
        aria-label="Switch project context"
        aria-expanded={isOpen}
      >
        <div className="p-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform">
          <FolderKanban className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-display text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
              {activeProject ? activeProject.name : "Select Project"}
            </span>
            {activeProject && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
                {activeProject.code}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-dropdown z-40 space-y-1 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Active Workspaces ({projects.length})</span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">Switch Context</span>
            </div>
            {projects.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No active projects found.
              </div>
            ) : (
              projects.map((p) => {
                const isSelected = activeProject?.id === p._id;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group",
                      isSelected
                        ? "bg-brand-50/90 dark:bg-brand-950/70 text-brand-900 dark:text-brand-200 font-medium border border-brand-200/60 dark:border-brand-800/80 shadow-2xs"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate font-display group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{p.code} • {p.location}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={p.status} size="sm" />
                      {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSwitcher;
