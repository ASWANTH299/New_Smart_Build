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
  variant = "default",
  className,
}) => {
  const iconVariants = {
    default: "bg-brand-50/80 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-900/60",
    amber: "bg-orange-50/80 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/60",
    steel: "bg-sky-50/80 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/60",
    emerald: "bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-card hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150 group",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-display">
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              "p-2.5 rounded-xl border transition-transform group-hover:scale-105",
              iconVariants[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight font-display tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 font-mono",
              trend.isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-800"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {(subtext || trend?.label) && (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {subtext || trend?.label}
        </p>
      )}
    </div>
  );
};

export default Metric;
