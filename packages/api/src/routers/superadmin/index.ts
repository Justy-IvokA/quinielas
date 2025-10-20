/**
 * Superadmin Router
 * 
 * Main router for SUPERADMIN operations
 * Combines tenants and templates routers
 */

import { router } from "../../trpc";
import { superadminTenantsRouter } from "./tenants";
import { superadminTemplatesRouter } from "./templates";
import { superadminBrandsRouter } from "./brands";

export const superadminRouter = router({
  tenants: superadminTenantsRouter,
  templates: superadminTemplatesRouter,
  brands: superadminBrandsRouter
});

// Export types
export * from "./schemas";
