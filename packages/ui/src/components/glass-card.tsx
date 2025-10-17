import * as React from "react";
import { cn } from "../lib/cn";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "xl";
  blur?: "sm" | "md" | "lg" | "xl";
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "md", children, ...props }, ref) => {
    const blurClasses = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl"
    };

    const variantClasses = {
      default: "p-6",
      compact: "p-4",
      xl: "p-8"
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base glass effect
          blurClasses[blur],
          "bg-white/10 dark:bg-slate-900/20",
          "border border-white/20 dark:border-white/10",
          "shadow-xl",
          "rounded-2xl",
          // Variant padding
          variantClasses[variant],
          // Custom classes
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
