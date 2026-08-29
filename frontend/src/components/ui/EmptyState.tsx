import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <FolderOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-4 shadow-sm transition-colors duration-150",
        className
      )}
    >
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">{icon}</div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        {description && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
