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
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-amber-200 rounded-xl space-y-4 shadow-card",
        className
      )}
    >
      <div className="p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
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
