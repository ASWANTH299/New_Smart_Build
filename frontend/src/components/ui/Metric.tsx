import React from "react";
import { cn } from "../../utils/cn.js";

export interface MetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "amber" | "steel" | "emerald";
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg p-4 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
          {label}
        </span>
        {icon && (
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-50 mt-2">
        {value}
      </div>
      {trend && (
        <div className="text-[11px] font-medium text-zinc-500 mt-1 flex items-center gap-1">
          {trend.value} {trend.label && <span>{trend.label}</span>}
        </div>
      )}
      {subtext && !trend && (
        <div className="text-[11px] font-medium text-zinc-500 mt-1 flex items-center gap-1">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default Metric;
