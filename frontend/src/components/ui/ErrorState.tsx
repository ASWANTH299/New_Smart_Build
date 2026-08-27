import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button.js";
import { cn } from "../../utils/cn.js";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "An error occurred while loading this section. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-white border border-red-200 rounded-xl space-y-4 shadow-card",
        className
      )}
      role="alert"
    >
      <div className="p-3 bg-red-50 text-red-600 rounded-full border border-red-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
