import { Skeleton } from "@/components/ui/skeleton";

export function Loader({ rows = 6, columns = 5, className = "" }) {
  return (
    <div className={`w-full min-w-0 space-y-4 ${className}`}>
      <div className="border border-border rounded-xs bg-card p-4 space-y-3 w-full">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <Skeleton className="h-4 w-32 rounded-xs" />
          <Skeleton className="h-4 w-20 rounded-xs" />
        </div>
        <div className="space-y-3 pt-1">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={`h-4 rounded-xs ${
                    j === 0 ? "w-24" : j === 1 ? "flex-1 min-w-28" : "w-16"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Loader;
