"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AlertDialogContext = createContext(null);

function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be used within AlertDialog");
  }
  return context;
}

export function AlertDialog({ open: controlledOpen, onOpenChange, children }) {
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
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({
  className,
  children,
  ...props
}) {
  const { open, setOpen } = useAlertDialog();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      className={cn(
        "fixed inset-0 m-auto z-50 rounded-xs bg-card p-6 text-card-foreground shadow-sm backdrop:bg-black/60 backdrop:backdrop-blur-xs",
        "animate-in fade-in zoom-in-95 duration-200 outline-none max-w-lg w-full max-h-144 overflow-y-auto border border-border",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-4">{children}</div>
    </dialog>
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }) {
  return <h2 className={cn("text-base font-semibold font-mono uppercase tracking-tight text-foreground", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
  return <p className={cn("text-xs font-mono text-muted-foreground leading-relaxed mt-1", className)} {...props} />;
}

export function AlertDialogAction({
  className,
  onClick,
  children,
  ...props
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button
      variant="destructive"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AlertDialogCancel({
  className,
  onClick,
  children,
  ...props
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button
      variant="outline"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
