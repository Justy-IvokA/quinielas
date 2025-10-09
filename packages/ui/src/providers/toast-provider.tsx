"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

export interface ToastProviderProps {
  children?: React.ReactNode;
}

/**
 * Toast provider using Sonner
 * Automatically syncs with the current theme
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Sonner
        theme={theme as "light" | "dark" | "system" | undefined}
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "group toast",
            title: "text-sm font-semibold",
            description: "text-sm opacity-90",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
            closeButton: "bg-background border-border"
          }
        }}
      />
    </>
  );
}
