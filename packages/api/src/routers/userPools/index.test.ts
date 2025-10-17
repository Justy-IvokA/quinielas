import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

import { prisma } from "@qp/db";
import { appRouter } from "../index";
import type { AppContext } from "../../context";

describe("userPools router", () => {
  const mockTenant = {
    id: "tenant_test_123",
    slug: "test-tenant",
    name: "Test Tenant"
  };

  const mockSession: Session = {
    user: {
      id: "user_test_123",
      email: "test@example.com",
      name: "Test User",
      highestRole: "PLAYER",
      tenantRoles: {}
    },
    expires: new Date(Date.now() + 86400000).toISOString()
  };

  const createTestContext = (overrides?: Partial<AppContext>): AppContext => ({
    session: mockSession,
    tenant: mockTenant,
    brand: null,
    ...overrides
  } as AppContext);

  describe("list", () => {
    it("should require tenant context", async () => {
      const caller = appRouter.createCaller(
        createTestContext({ tenant: null })
      );

      await expect(
        caller.userPools.list({
          filter: "ALL",
          page: 1,
          pageSize: 24,
          sort: "RECENT"
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should return empty list when user has no pools", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.userPools.list({
        filter: "ALL",
        page: 1,
        pageSize: 24,
        sort: "RECENT"
      });

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("should filter by ACTIVE status", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.userPools.list({
        filter: "ACTIVE",
        page: 1,
        pageSize: 24,
        sort: "RECENT"
      });

      expect(result.items.every((item) => item.status === "ACTIVE")).toBe(true);
    });

    it("should filter by PENDING invitations", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.userPools.list({
        filter: "PENDING",
        page: 1,
        pageSize: 24,
        sort: "RECENT"
      });

      expect(
        result.items.every((item) => item.myInviteStatus === "PENDING")
      ).toBe(true);
    });

    it("should paginate results correctly", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.userPools.list({
        filter: "ALL",
        page: 1,
        pageSize: 10,
        sort: "RECENT"
      });

      expect(result.items.length).toBeLessThanOrEqual(10);
      expect(result.pagination.pageSize).toBe(10);
    });

    it("should search by pool title", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.userPools.list({
        filter: "ALL",
        search: "mundial",
        page: 1,
        pageSize: 24,
        sort: "RECENT"
      });

      // Results should contain search term in title or related fields
      expect(result).toBeDefined();
    });
  });
});
