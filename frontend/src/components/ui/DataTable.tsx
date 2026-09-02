import React from "react";
import { SkeletonTable } from "./Skeleton.js";
import { EmptyState } from "./EmptyState.js";
import { cn } from "../../utils/cn.js";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor = (item: T) => {
    const row = item as Record<string, unknown>;
    return String(row._id || row.id || Math.random());
  },
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "No data matches your current criteria.",
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable cols={columns.length || 4} rows={5} className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-card transition-colors",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-display">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3.5",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900">
            {data.map((row) => {
              const key = keyExtractor(row);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "transition-colors duration-150 group",
                    onRowClick
                      ? "cursor-pointer hover:bg-zinc-50/90 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800"
                      : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  )}
                >
                  {columns.map((col) => {
                    const cellValue = (row as Record<string, unknown>)[col.key];
                    return (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn(
                          "px-4 py-3.5 text-zinc-800 dark:text-zinc-200 font-sans",
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right",
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : col.accessor
                          ? col.accessor(row)
                          : (cellValue as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
