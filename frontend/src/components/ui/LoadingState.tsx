import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface LoadingStateProps {
  message?: string;
  className?: string;
  fullscreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading data...",
  className,
  fullscreen = false,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-3",
        fullscreen && "min-h-[60vh]",
        className
      )}
      role="status"
    >
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};

export default LoadingState;
