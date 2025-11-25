"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const DialogContext = createContext(null);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog");
  }
  return context;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }) {
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
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild, ...props }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export function DialogContent({ className, children, ...props }) {
  const { open, setOpen } = useDialog();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      setOpen(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      className={cn(
        "fixed inset-0 m-auto z-50 rounded-xs bg-card p-6 text-card-foreground shadow-sm backdrop:bg-black/60 backdrop:backdrop-blur-xs",
        "animate-in fade-in zoom-in-95 duration-200 outline-none max-w-lg w-full max-h-144 overflow-y-auto border border-border",
        className
      )}
    >
      <div className="relative" {...props}>
        {children}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-0 rounded-xs p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </dialog>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1 text-left mb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-base font-semibold font-mono uppercase tracking-tight text-foreground", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-xs font-mono text-muted-foreground leading-relaxed mt-1", className)} {...props} />;
}

export function DialogClose({ children, asChild, ...props }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(false);
      },
    });
  }

  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
