import React, { HTMLAttributes } from "react";
import { cn } from "../../utils/cn.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700/80 overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-display tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
