import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn.js";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Frame */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0 z-50 relative">
        <div
          className={cn(
            "relative transform overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full text-left transition-all sm:my-8",
            sizeStyles[size],
            className
          )}
        >
          {title && (
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
                {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-5 text-xs text-zinc-600 dark:text-zinc-300 space-y-4">{children}</div>
          {footer && (
            <div className="px-5 py-3 bg-zinc-50/60 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
