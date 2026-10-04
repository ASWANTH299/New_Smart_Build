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
  icon = <FolderOpen className="w-5 h-5" />,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-3">{icon}</div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">{title}</h4>
      {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
