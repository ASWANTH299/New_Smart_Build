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
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-200 group", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">{label}</span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-brand-50/80 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/60 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-display">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
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
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{subtext || trend?.label}</p>
      )}
    </div>
  );
};

export default Metric;
