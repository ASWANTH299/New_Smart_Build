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
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {icon && <div className="p-2 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded",
              trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {(subtext || trend?.label) && (
        <p className="mt-1 text-xs text-slate-500">{subtext || trend?.label}</p>
      )}
    </div>
  );
};

export default Metric;
