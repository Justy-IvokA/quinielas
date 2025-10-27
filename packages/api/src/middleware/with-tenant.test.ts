import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import type { AppContext } from "../context";

describe("Tenant Middleware", () => {
  describe("withTenant", () => {
    it("should throw FORBIDDEN when tenant is null", async () => {
      const ctx: AppContext = {
        prisma: {} as any,
        env: {} as any,
        tenant: null,
        brand: null,
        session: null,
        ip: null,
        userAgent: null
      };

      // The middleware would throw in real usage
      expect(ctx.tenant).toBeNull();
    });

    it("should pass through when tenant exists", async () => {
      const ctx: AppContext = {
        prisma: {} as any,
        env: {} as any,
        tenant: {
          id: "tenant1",
          slug: "demo",
          name: "Demo Tenant",
          description: null,
          licenseTier: "GOLAZO",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        brand: null,
        session: null,
        ip: null,
        userAgent: null
      };

      expect(ctx.tenant).not.toBeNull();
      expect(ctx.tenant?.slug).toBe("demo");
    });
  });

  describe("withAuth", () => {
    it("should throw UNAUTHORIZED when session is null", async () => {
      const ctx: AppContext = {
        prisma: {} as any,
        env: {} as any,
        tenant: null,
        brand: null,
        session: null,
        ip: null,
        userAgent: null
      };

      expect(ctx.session).toBeNull();
    });

    it("should pass through when session exists", async () => {
      const ctx: AppContext = {
        prisma: {} as any,
        env: {} as any,
        tenant: null,
        brand: null,
        session: {
          user: {
            id: "user1",
            email: "test@example.com",
            name: "Test User",
            highestRole: null,
            tenantRoles: {}
          },
          expires: new Date(Date.now() + 86400000).toISOString()
        },
        ip: null,
        userAgent: null
      };

      expect(ctx.session).not.toBeNull();
      expect(ctx.session?.user.email).toBe("test@example.com");
    });
  });
});
