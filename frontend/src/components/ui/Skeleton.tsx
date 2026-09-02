import React from "react";
import { cn } from "../../utils/cn.js";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 shimmer-mask",
        className
      )}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={cn(
            "h-4",
            idx === lines - 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-card",
        className
      )}
    >
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 p-4 grid grid-cols-4 gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={`th-${idx}`} className="h-4 w-3/4" />
        ))}
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 p-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`tr-${rIdx}`} className="p-3.5 grid grid-cols-4 gap-4 items-center">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton
                key={`td-${rIdx}-${cIdx}`}
                className={cn("h-4", cIdx === 0 ? "w-4/5" : "w-1/2")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
