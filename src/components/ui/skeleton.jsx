import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xs bg-muted/60 animate-pulse",
        className
      )}
      {...props}
    />
  );
}
