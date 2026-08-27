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
        "bg-white border border-slate-200 rounded-xl shadow-card transition-shadow hover:shadow-elevated overflow-hidden",
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
      {footer && <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600">{footer}</div>}
    </div>
  );
};

export default Card;
