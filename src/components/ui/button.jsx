import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-primary text-primary-foreground shadow-none hover:bg-primary/90 active:scale-[0.99]",
  destructive: "bg-destructive text-white shadow-none hover:bg-destructive/90 active:scale-[0.99]",
  outline: "border border-border bg-background hover:bg-muted hover:text-foreground shadow-none active:scale-[0.99]",
  secondary: "bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/80 active:scale-[0.99]",
  ghost: "hover:bg-muted hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  accent: "bg-accent text-accent-foreground shadow-none hover:bg-accent/90 active:scale-[0.99]",
};

const sizeClasses = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-xs px-3 text-xs",
  lg: "h-10 rounded-xs px-6 text-sm",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const combinedClassName = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xs text-xs font-mono uppercase tracking-wider font-semibold transition-colors outline-none",
      "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      variantClasses[variant] || variantClasses.default,
      sizeClasses[size] || sizeClasses.default,
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(combinedClassName, children.props.className),
        ...props,
      });
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
