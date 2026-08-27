import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "./Button.js";
import { cn } from "../../utils/cn.js";

export interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search records...",
  children,
  onClearFilters,
  hasActiveFilters,
  className,
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-card", className)}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}

      {hasActiveFilters && onClearFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs text-slate-500">
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
