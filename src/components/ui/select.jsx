"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Check, ChevronDown } from "lucide-react";

const SelectContext = createContext(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

export function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [triggerText, setTriggerText] = useState("");
  const triggerRef = useRef(null);
  const itemsMap = useRef(new Map());

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (val) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    const label = itemsMap.current.get(val);
    if (label) setTriggerText(label);
    onValueChange?.(val);
    setOpen(false);
  };

  const registerItem = (val, label) => {
    itemsMap.current.set(val, label);
    if (val === value) {
      setTriggerText(label);
    }
  };

  useEffect(() => {
    if (value && itemsMap.current.has(value)) {
      setTriggerText(itemsMap.current.get(value) || "");
    }
  }, [value]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        triggerText,
        setTriggerText,
        registerItem,
        triggerRef,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectGroup = ({ className, ...props }) => (
  <div className={cn("p-1", className)} {...props} />
);

export function SelectValue({ placeholder }) {
  const { triggerText, value } = useSelectContext();
  return (
    <span className={cn("truncate", !value && "text-muted-foreground")}>
      {triggerText || value || placeholder}
    </span>
  );
}

export function SelectTrigger({
  className,
  children,
  disabled = false,
  ...props
}) {
  const { open, setOpen, triggerRef } = useSelectContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-xs border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-none ring-offset-background",
        "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}) {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 200 && spaceAbove > spaceBelow;

    setCoords({
      left: Math.max(8, rect.left),
      width: rect.width,
      top: openUpwards ? null : rect.bottom + 4,
      bottom: openUpwards ? window.innerHeight - rect.top + 4 : null,
      maxHeight: Math.min(240, openUpwards ? spaceAbove - 16 : spaceBelow - 16),
    });
  }, [triggerRef]);

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleScroll = (e) => {
        if (contentRef.current && contentRef.current.contains(e.target)) return;
        updatePosition();
      };
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open, updatePosition]);

  useClickOutside([contentRef, triggerRef], () => {
    if (open) setOpen(false);
  });

  if (!open || !mounted || !coords) return null;

  return createPortal(
    <div
      ref={contentRef}
      style={{
        position: "fixed",
        left: coords.left,
        width: coords.width,
        top: coords.top !== null ? coords.top : "auto",
        bottom: coords.bottom !== null ? coords.bottom : "auto",
        maxHeight: coords.maxHeight,
        zIndex: 9999,
      }}
      className={cn(
        "overflow-y-auto rounded-xs border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}

export function SelectLabel({ className, ...props }) {
  return <div className={cn("px-2 py-1.5 text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground", className)} {...props} />;
}

export function SelectItem({
  value,
  children,
  className,
  disabled = false,
  ...props
}) {
  const { value: selectedValue, onValueChange, registerItem } = useSelectContext();
  const isSelected = selectedValue === value;
  const label = typeof children === "string" ? children : value;

  useEffect(() => {
    registerItem(value, label);
  }, [value, label, registerItem]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        if (!disabled && onValueChange) {
          onValueChange(value);
        }
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-xs py-1.5 pl-8 pr-2 text-xs font-mono outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground font-semibold",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
}
