"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes";

export type ThemeProviderProps = NextThemesProviderProps;

/**
 * Theme provider wrapper for next-themes
 * Enables system, light, and dark theme switching with persistence
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="qp-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

/**
 * Re-export useTheme hook from next-themes for convenience
 */
export { useTheme } from "next-themes";
