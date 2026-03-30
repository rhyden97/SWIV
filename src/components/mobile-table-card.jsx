"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MobileTableCard({
  item,
  primaryFields = [],
  secondaryFields = [],
  actions,
  badge,
}) {
  const [expanded, setExpanded] = useState(false);

  const titleField = primaryFields[0];
  const detailFields = primaryFields.slice(1);

  return (
    <div className="p-4 mb-3 bg-card rounded-xs border border-border transition-colors space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
            {titleField?.label}
          </span>
          <h4 className="text-sm font-semibold text-foreground truncate mt-0.5">
            {titleField?.value}
          </h4>
        </div>
        {badge && (
          typeof badge === "object" && "text" in badge ? (
            <Badge
              variant={badge.variant || "default"}
              className="whitespace-nowrap font-mono text-xs rounded-xs shrink-0"
            >
              {badge.text}
            </Badge>
          ) : (
            <div className="shrink-0">{badge}</div>
          )
        )}
      </div>

      {detailFields.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xs bg-muted/20 border border-border">
          {detailFields.map((field, idx) => {
            const isTotal =
              field.label.toLowerCase().includes("total") ||
              field.label.toLowerCase().includes("monto") ||
              field.label.toLowerCase().includes("precio");
            return (
              <div key={idx} className="flex flex-col min-w-0">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {field.label}
                </span>
                <span
                  className={`text-xs font-mono mt-0.5 truncate ${
                    isTotal
                      ? "text-primary font-semibold tabular-nums"
                      : "text-foreground font-medium"
                  }`}
                >
                  {field.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {secondaryFields && secondaryFields.length > 0 && expanded && (
        <div className="space-y-2 pt-2 border-t border-border">
          {secondaryFields.map((field, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center gap-3 text-xs font-mono"
            >
              <span className="text-muted-foreground uppercase tracking-wider">
                {field.label}
              </span>
              <span className="text-foreground font-medium tabular-nums truncate max-w-xs text-right px-2 py-0.5 rounded-xs border border-border bg-muted/30">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {(actions || (secondaryFields && secondaryFields.length > 0)) && (
        <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
          {actions && (
            <div className="flex-1 flex gap-2 items-center min-h-8">
              {actions}
            </div>
          )}

          {secondaryFields && secondaryFields.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors h-8 px-2.5 rounded-xs border border-border bg-card hover:bg-muted ml-auto"
            >
              <span>{expanded ? "Menos" : "Detalles"}</span>
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
