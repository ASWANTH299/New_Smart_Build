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
      "inline-flex items-center justify-center font-medium transition-all duration-100 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-md";

    const variantStyles = {
      primary:
        "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs font-semibold",
      secondary:
        "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 shadow-2xs",
      outline:
        "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 shadow-2xs",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 shadow-xs",
      ghost:
        "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
      amber:
        "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold shadow-xs",
    };

    const sizeStyles = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-8 px-3 text-xs gap-2",
      lg: "h-9 px-4 text-sm gap-2",
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
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
