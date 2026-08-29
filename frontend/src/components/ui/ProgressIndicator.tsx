import React from "react";
import { cn } from "../../utils/cn.js";

export interface ProgressIndicatorProps {
  progress: number;
  plannedQuantity?: number;
  completedQuantity?: number;
  unit?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  plannedQuantity,
  completedQuantity,
  unit,
  label,
  size = "md",
  showLabel = true,
  className,
}) => {
  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-emerald-500 shadow-2xs";
    if (pct >= 50) return "bg-gradient-to-r from-brand-600 to-brand-500 shadow-2xs";
    return "bg-brand-500 shadow-2xs";
  };

  const heightStyles = {
    sm: "h-2",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">{label || "Progress"}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-display">{clampedProgress}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700/80 p-0.5", heightStyles[size])}>
        <div
          className={cn("h-full transition-all duration-300 rounded-full", getBarColor(clampedProgress))}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {plannedQuantity !== undefined && completedQuantity !== undefined && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span>
            Completed: {completedQuantity.toLocaleString()} {unit || ""}
          </span>
          <span>
            Planned: {plannedQuantity.toLocaleString()} {unit || ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
