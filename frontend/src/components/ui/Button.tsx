import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn.js";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "amber";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer touch-target sm:touch-auto";

    const variantStyles = {
      primary:
        "bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/25 focus:ring-brand-500 border border-brand-500/30",
      secondary:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:ring-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60",
      outline:
        "border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 focus:ring-brand-500 shadow-2xs",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20 focus:ring-red-500 border border-red-500/30",
      ghost:
        "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 focus:ring-zinc-400",
      amber:
        "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-500/25 focus:ring-orange-500 border border-orange-500/30",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[36px] sm:min-h-0",
      md: "text-sm px-4 py-2 gap-2 min-h-[42px] sm:min-h-0",
      lg: "text-base px-5 py-2.5 gap-2.5 min-h-[48px] sm:min-h-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
