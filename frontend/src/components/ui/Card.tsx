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
        "bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-card transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700/80 overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-850/40 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base font-display tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-5 sm:p-6")}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-zinc-50/80 dark:bg-zinc-850/50 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
