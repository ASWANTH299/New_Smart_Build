import React from "react";
import { cn } from "../../utils/cn.js";
import { StatusVariant } from "../../types/index.js";

export interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

const getStyles = (status: string) => {
  const normalizedKey = status.toLowerCase();
  
  if (["completed", "approved", "achieved", "active", "healthy", "issued", "receipt", "fulfilled", "client"].includes(normalizedKey)) {
    return {
      wrapper: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  }
  
  if (["in_progress", "submitted", "pending", "under_maintenance", "risk", "pending_activation", "in_review", "partially_issued", "adjustment", "consumption", "reorder_level_reached", "pending_approval", "partially_received", "contractor"].includes(normalizedKey)) {
    return {
      wrapper: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
    };
  }
  
  if (["critical", "delayed", "blocked", "breakdown", "open", "rejected", "locked", "urgent", "critical_low_stock", "blacklisted"].includes(normalizedKey)) {
    return {
      wrapper: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dot: "bg-rose-500 animate-pulse",
    };
  }
  
  if (["closed", "resolved", "medium", "transfer_in", "transfer_out", "admin", "project_manager", "site_engineer", "store_manager"].includes(normalizedKey)) {
    return {
      wrapper: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      dot: "bg-blue-500",
    };
  }

  return {
    wrapper: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-400",
  };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
}) => {
  const styles = getStyles(status);
  const displayLabel = label || status.replace(/_/g, " ").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-tight border capitalize",
        styles.wrapper,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", styles.dot)} />
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
