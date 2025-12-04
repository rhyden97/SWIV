import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto border border-border rounded-xs bg-card">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-xs border-collapse", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-muted/40 [&_tr]:border-b [&_tr]:border-border sticky top-0 z-10", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-border [&_tr:last-child]:border-0 divide-y divide-border/60", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border hover:bg-blue-500/[0.03] dark:hover:bg-blue-500/[0.06] data-[state=selected]:bg-primary/10 transition-colors",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-9 px-3.5 text-left align-middle font-mono font-medium text-xs uppercase tracking-wider text-muted-foreground",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-3.5 py-2.5 align-middle text-xs text-foreground", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";
