import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actionButton,
  className,
  titleClassName,
}) {
  return (
    <div
      className={cn(
        "mb-8 pb-5 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0",
        className
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "text-2xl sm:text-3xl font-semibold tracking-tight text-foreground",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actionButton && (
        <div className="shrink-0 flex items-center gap-2">
          {actionButton}
        </div>
      )}
    </div>
  );
}
