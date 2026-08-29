import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400", className)}>
      <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors inline-flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "font-semibold text-slate-900 dark:text-slate-100" : "")}>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
