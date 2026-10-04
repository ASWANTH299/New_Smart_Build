import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs",
        className
      )}
    >
      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
        {totalItems !== undefined ? (
          <span>
            Page {page} of {totalPages} ({totalItems} total records)
          </span>
        ) : (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 px-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 px-2.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
