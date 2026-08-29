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
        "flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-xl space-y-4 shadow-card transition-colors duration-150",
        className
      )}
      role="alert"
    >
      <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/40">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
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
