import React from "react";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./Button.js";
import { cn } from "../../utils/cn.js";

export interface PermissionDeniedProps {
  title?: string;
  message?: string;
  backUrl?: string;
  className?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  title = "Permission Denied",
  message = "You do not have the required permissions to access this page or resource.",
  backUrl = "/dashboard",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-4 shadow-card transition-colors duration-150",
        className
      )}
    >
      <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/40">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
      </div>
      <div className="pt-2">
        <Link to={backUrl}>
          <Button variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PermissionDenied;
