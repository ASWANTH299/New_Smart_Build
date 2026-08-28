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
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-brand-500"
        aria-label="Switch project context"
        aria-expanded={isOpen}
      >
        <FolderKanban className="w-4 h-4 text-brand-600 shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
              {activeProject ? activeProject.name : "Select Project"}
            </span>
            {activeProject && (
              <span className="text-[10px] font-mono text-slate-500 font-medium">
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
          <div className="absolute left-0 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-40 space-y-1 max-h-80 overflow-y-auto">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Active Projects ({projects.length})
            </div>
            {projects.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-500">
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
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left",
                      isSelected ? "bg-brand-50 text-brand-900 font-medium" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{p.code} • {p.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={p.status} size="sm" />
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
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
