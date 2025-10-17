import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "../lib/cn";

const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-30 relative",
  {
    variants: {
      color: {
        primary: [
          // Base colors
          "bg-brand-default",
          "text-brand",
          // Hover state
          "enabled:hover:bg-brand-emphasis",
          // Focus state
          "focus-visible:outline-none",
          "focus-visible:ring-0",
          "focus-visible:shadow-button-solid-brand-focused",
          // Border
          "border border-brand-default",
          // Disabled
          "disabled:opacity-30",
          // Shadows and effects
          "shadow-button-solid-brand-default",
          "enabled:active:shadow-button-solid-brand-active",
          "enabled:hover:shadow-button-solid-brand-hover",
          "transition-shadow",
          "transition-transform",
          "duration-100",
        ],

        secondary: [
          // Base colors and border
          "bg-default",
          "text-default",
          "border",
          "border-default",
          // Hover state
          "enabled:hover:bg-muted",
          "enabled:hover:text-emphasis",
          // Disabled
          "disabled:opacity-30",
          // Focus state
          "focus-visible:bg-subtle",
          "focus-visible:outline-none",
          "focus-visible:ring-0",
          "focus-visible:shadow-outline-gray-focused",
          // Shadows and effects
          "shadow-outline-gray-rested",
          "enabled:hover:shadow-outline-gray-hover",
          "enabled:active:shadow-outline-gray-active",
          "transition-shadow",
          "duration-200",
        ],

        minimal: [
          // Base color
          "text-subtle",
          "border border-transparent",
          // Hover
          "enabled:hover:bg-subtle",
          "enabled:hover:text-emphasis",
          "enabled:hover:border-subtle hover:border",
          // Disabled
          "disabled:opacity-30",
          // Focus
          "focus-visible:bg-subtle",
          "focus-visible:outline-none",
          "focus-visible:ring-0",
          "focus-visible:border-subtle",
          "focus-visible:shadow-button-outline-gray-focused",

          // Shadows and effects
          "enabled:active:shadow-outline-gray-active",
          "transition-shadow",
          "duration-200",
        ],

        destructive: [
          // Base colors and border
          "border",
          "border-default",
          "text-error",
          // Hover state
          "dark:hover:text-red-100",
          "hover:border-semantic-error",
          "hover:bg-error",
          // Focus state
          "focus-visible:text-red-700",
          "focus-visible:bg-error",
          "focus-visible:outline-none",
          "focus-visible:ring-0",
          "focus-visible:shadow-button-outline-red-focused",
          // Disabled state
          "disabled:bg-red-100",
          "disabled:border-red-200",
          "disabled:text-red-700",
          "disabled:hover:border-red-200",
          "disabled:opacity-30",
          // Shadows and effects
          "shadow-outline-red-rested",
          "enabled:hover:shadow-outline-red-hover",
          "enabled:active:shadow-outline-red-active",
          "transition-shadow",
          "duration-200",
        ],
      },
      variant: {
        default: [
          "bg-primary text-primary-foreground border border-primary",
          "hover:bg-primary/90 hover:shadow-md",
          "focus-visible:shadow-lg",
          "active:shadow-sm active:translate-y-[1px]",
          "transition-all duration-100"
        ],
        secondary: [
          "bg-background text-foreground border border-border",
          "hover:bg-muted hover:text-accent-foreground",
          "focus-visible:bg-muted focus-visible:shadow-md",
          "active:shadow-sm",
          "transition-all duration-200"
        ],
        minimal: [
          "text-muted-foreground border border-transparent",
          "hover:bg-muted hover:text-foreground hover:border-border",
          "focus-visible:bg-muted focus-visible:border-border focus-visible:shadow-sm",
          "active:shadow-none",
          "transition-all duration-200"
        ],
        destructive: [
          "border border-border text-destructive",
          "hover:border-destructive hover:bg-destructive hover:text-destructive-foreground",
          "focus-visible:text-destructive focus-visible:bg-destructive/10",
          "focus-visible:shadow-md",
          "disabled:bg-destructive/10 disabled:border-destructive/20 disabled:text-destructive/50",
          "transition-all duration-200"
        ],
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline: [
          "border border-border bg-background text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-all duration-200"
        ],
      },
      size: {
        xs: "h-6 px-2 py-1 text-xs rounded-md",
        sm: "h-7 px-2 py-1.5 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6 py-2.5 text-base",
        icon: "h-10 w-10 p-0"
      },
      loading: {
        true: "cursor-wait"
      }
    },
    compoundVariants: [
      {
        loading: true,
        variant: "default",
        className: "opacity-60"
      },
      {
        loading: true,
        variant: "secondary",
        className: "bg-muted text-muted-foreground"
      },
      {
        loading: true,
        variant: "minimal",
        className: "bg-muted text-muted-foreground/50"
      },
      {
        loading: true,
        variant: "destructive",
        className: "text-destructive/50 border-border"
      },
      {
        variant: "default",
        size: "icon",
        className: "rounded-[10px]"
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  StartIcon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  EndIcon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href?: string;
  shallow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      color,
      asChild = false,
      loading = false,
      StartIcon,
      EndIcon,
      children,
      disabled,
      href,
      shallow,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const isLink = typeof href !== "undefined";

    // When using asChild, don't render StartIcon/EndIcon - let the child handle its own content
    const shouldRenderIcons = !asChild;

    const content = (
      <>
        {shouldRenderIcons && StartIcon && (
          <StartIcon
            className={cn(
              "h-4 w-4 stroke-[1.5px] transition-transform group-active:translate-y-[0.5px]",
              loading && "invisible"
            )}
          />
        )}
        {shouldRenderIcons ? (
          <span className={cn(loading && "invisible")}>{children}</span>
        ) : (
          children
        )}
        {shouldRenderIcons && EndIcon && (
          <EndIcon
            className={cn(
              "h-4 w-4 stroke-[1.5px] transition-transform group-active:translate-y-[0.5px]",
              loading && "invisible"
            )}
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </>
    );

    if (isLink) {
      return (
        <Link
          href={href}
          shallow={shallow}
          className={cn(buttonVariants({ variant, size, loading, color }), className)}
        >
          {content}
        </Link>
      );
    }

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, loading, color }), className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, loading, color }), className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
