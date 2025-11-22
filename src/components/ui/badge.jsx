import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariantClasses = {
  default:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
  secondary:
    "border-border bg-muted/60 text-muted-foreground",
  destructive:
    "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400",
  outline:
    "border-border bg-transparent text-foreground",
  info:
    "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400",
};

export const Badge = React.forwardRef(
  ({ className, variant = "default", dot = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xs border px-2 py-0.5 text-xs font-mono tracking-tight w-fit whitespace-nowrap shrink-0 gap-1.5 transition-colors",
          badgeVariantClasses[variant] || badgeVariantClasses.default,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "inline-block size-1.5 rounded-full shrink-0",
              variant === "destructive" && "bg-rose-500",
              variant === "warning" && "bg-amber-500",
              variant === "info" && "bg-blue-500",
              variant === "secondary" && "bg-muted-foreground",
              (variant === "default" || variant === "success") && "bg-emerald-500"
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
