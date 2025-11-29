import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-16 w-full rounded-xs border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-none placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {typeof error === "string" && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
