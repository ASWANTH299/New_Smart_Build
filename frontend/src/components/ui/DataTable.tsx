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
        "w-full border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-xs",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-zinc-50/80 dark:bg-zinc-950/60 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 py-2.5 px-3.5 text-left",
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
          <tbody className="bg-white dark:bg-zinc-900">
            {data.map((row) => {
              const key = keyExtractor(row);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => {
                    const cellValue = (row as Record<string, unknown>)[col.key];
                    return (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn(
                          "text-xs font-normal text-zinc-800 dark:text-zinc-200 py-3 px-3.5 align-middle",
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
