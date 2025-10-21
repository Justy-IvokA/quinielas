import type { TenantRole } from "@qp/db";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      highestRole: TenantRole | null;
      tenantRoles: Record<string, TenantRole>;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    highestRole?: TenantRole | null;
    tenantRoles?: Record<string, TenantRole>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    highestRole: TenantRole | null;
    tenantRoles: Record<string, TenantRole>;
  }
}

// Re-export Session type for use in other packages
export type { Session } from "next-auth";
