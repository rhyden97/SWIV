"use client";

import * as React from "react";
import { createContext, useContext, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

const DropdownContext = createContext(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within DropdownMenu");
  }
  return context;
}

export function DropdownMenu({ children, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => {
    if (open) setOpen(false);
  });

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div
        ref={containerRef}
        className={cn("relative inline-block text-left", className)}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
  ...props
}) {
  const { open, setOpen } = useDropdown();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  className,
  align = "right",
  side = "bottom",
  children,
  ...props
}) {
  const { open } = useDropdown();

  if (!open) return null;

  const isRight = align === "right" || align === "end";
  const isCenter = align === "center";
  const isTop = side === "top";

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 min-w-32 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        isTop ? "bottom-full mb-1.5" : "mt-1",
        isCenter ? "left-1/2 -translate-x-1/2" : isRight ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  children,
  ...props
}) {
  const { setOpen } = useDropdown();

  return (
    <div
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />;
}
