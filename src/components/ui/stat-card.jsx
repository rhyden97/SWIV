import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  subtitle,
  change,
  trend = "neutral",
  badge,
  valueClassName = "",
  className = "",
}) {
  return (
    <div className={cn("p-4 sm:p-5 flex flex-col justify-between bg-card min-w-0", className)}>
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
        <span className="truncate">{title}</span>
        {badge}
      </div>
      <div className="mt-2">
        <div
          className={cn(
            "text-2xl sm:text-3xl font-mono tabular-nums font-bold tracking-tight text-foreground",
            valueClassName
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        )}
        {change !== undefined && change !== null && (
          <div className="text-xs font-mono mt-1.5 flex items-center gap-1">
            <span
              className={cn(
                trend === "up" && "text-emerald-600 dark:text-emerald-400",
                trend === "down" && "text-destructive",
                trend === "warning" && "text-amber-600 dark:text-amber-400",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
            {subtitle && !change.includes?.("vs") && (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
