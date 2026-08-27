import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast, ToastItem } from "../../hooks/useToast.js";
import { cn } from "../../utils/cn.js";

const iconMap = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
};

const bgMap = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast: ToastItem) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-elevated transition-all transform duration-200 ease-out",
            bgMap[toast.type]
          )}
        >
          <div className="flex items-start gap-2.5">
            {iconMap[toast.type]}
            <div className="space-y-0.5">
              <h5 className="text-xs font-semibold">{toast.title}</h5>
              {toast.message && <p className="text-xs opacity-90 leading-tight">{toast.message}</p>}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
