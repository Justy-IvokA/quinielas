"use client";

import React, { createContext, useContext } from "react";
import type { Brand, Tenant } from "@qp/db";

/**
 * Brand context for admin panel
 * Provides access to current brand and tenant information
 */
interface BrandContextValue {
  brand: (Brand & { tenant: Tenant }) | null;
  tenant: Tenant | null;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

interface BrandProviderProps {
  children: React.ReactNode;
  brand: (Brand & { tenant: Tenant }) | null;
  tenant: Tenant | null;
}

export function BrandProvider({ children, brand, tenant }: BrandProviderProps) {
  return (
    <BrandContext.Provider value={{ brand, tenant }}>
      {children}
    </BrandContext.Provider>
  );
}

/**
 * Hook to access brand context
 * @throws Error if used outside BrandProvider
 */
export function useBrand() {
  const context = useContext(BrandContext);
  
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  
  return context;
}

/**
 * Hook to get brand ID safely
 * Returns null if brand is not available
 */
export function useBrandId(): string | null {
  const { brand } = useBrand();
  return brand?.id || null;
}

/**
 * Hook to get tenant ID safely
 * Returns null if tenant is not available
 */
export function useTenantId(): string | null {
  const { tenant } = useBrand();
  return tenant?.id || null;
}
