import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        gray: "bg-muted text-muted-foreground",
        purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        outline: "border border-border bg-background text-foreground"
      },
      size: {
        sm: "px-1 py-0.5 text-[10px] leading-none",
        default: "px-1.5 py-1 text-xs leading-none",
        lg: "px-2 py-1 text-sm leading-none rounded-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  StartIcon?: LucideIcon;
  withDot?: boolean;
}

function Badge({ className, variant, size, StartIcon, withDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {withDot && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <circle cx="4" cy="4" r="4" />
        </svg>
      )}
      {StartIcon && <StartIcon className="h-3 w-3 stroke-[2.5px]" />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
