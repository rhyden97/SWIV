"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const SheetContext = createContext(null);

function useSheet() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return context;
}

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  asChild,
  children,
  className,
  ...props
}) {
  const { setOpen } = useSheet();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}) {
  const { open, setOpen } = useSheet();

  if (!open) return null;

  const sideClasses = {
    top: "inset-x-0 top-0 border-b border-border animate-in slide-in-from-top",
    bottom: "inset-x-0 bottom-0 border-t border-border animate-in slide-in-from-bottom",
    left: "inset-y-0 left-0 h-full w-3/4 border-r border-border sm:max-w-sm animate-in slide-in-from-left",
    right: "inset-y-0 right-0 h-full w-3/4 border-l border-border sm:max-w-sm animate-in slide-in-from-right",
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out duration-200 border-border",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3.5 top-3.5 z-50 flex h-7 w-7 items-center justify-center rounded-xs border border-border bg-background/90 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-none"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Cerrar</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

export function SheetFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function SheetDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
