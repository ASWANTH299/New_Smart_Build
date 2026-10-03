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
        "bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs overflow-hidden",
        !noPadding && "p-4 sm:p-5",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/70 pb-3 mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
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
      <div className={cn(noPadding && "px-4 sm:px-5")}>
        {children}
      </div>
      {footer && (
        <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/70 text-xs text-zinc-600 dark:text-zinc-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
