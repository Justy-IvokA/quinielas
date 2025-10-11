import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCallerFactory } from "../trpc";
import { appRouter } from "./index";
import type { AppContext } from "../context";
import { prisma } from "@qp/db";
import type { Session } from "next-auth";

const createCaller = createCallerFactory(appRouter);

describe("Tenant Router", () => {
  const mockSuperAdminSession: Session = {
    user: {
      id: "superadmin-id",
      email: "superadmin@test.com",
      highestRole: "SUPERADMIN",
      tenantRoles: { "tenant-1": "SUPERADMIN" }
    },
    expires: ""
  };

  const mockTenantAdminSession: Session = {
    user: {
      id: "admin-id",
      email: "admin@test.com",
      highestRole: "TENANT_ADMIN",
      tenantRoles: { "tenant-1": "TENANT_ADMIN" }
    },
    expires: ""
  };

  const mockPlayerSession: Session = {
    user: {
      id: "player-id",
      email: "player@test.com",
      highestRole: "PLAYER",
      tenantRoles: { "tenant-1": "PLAYER" }
    },
    expires: ""
  };

  const createTestContext = (session: Session | null): AppContext => ({
    prisma,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      NODE_ENV: "test",
      SPORTS_API_PROVIDER: "mock",
      EMAIL_PROVIDER: "mock"
    },
    tenant: null,
    brand: null,
    session,
    req: undefined
  });

  describe("Authorization", () => {
    it("should allow SUPERADMIN to list tenants", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const result = await caller.tenant.list({ page: 1, limit: 10 });
      expect(result).toHaveProperty("tenants");
      expect(result).toHaveProperty("pagination");
    });

    it("should deny TENANT_ADMIN from listing tenants", async () => {
      const caller = createCaller(createTestContext(mockTenantAdminSession));
      await expect(caller.tenant.list({ page: 1, limit: 10 })).rejects.toThrow("FORBIDDEN");
    });

    it("should deny PLAYER from listing tenants", async () => {
      const caller = createCaller(createTestContext(mockPlayerSession));
      await expect(caller.tenant.list({ page: 1, limit: 10 })).rejects.toThrow("FORBIDDEN");
    });

    it("should deny unauthenticated users", async () => {
      const caller = createCaller(createTestContext(null));
      await expect(caller.tenant.list({ page: 1, limit: 10 })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("CRUD Operations", () => {
    let testTenantId: string;

    it("should create a tenant as SUPERADMIN", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const result = await caller.tenant.create({
        name: "Test Tenant",
        slug: `test-tenant-${Date.now()}`,
        description: "A test tenant",
        defaultBrand: {
          name: "Default Brand",
          slug: "default",
          description: "Default brand"
        }
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("Test Tenant");
      expect(result.brands).toHaveLength(1);
      testTenantId = result.id;
    });

    it("should reject duplicate slug", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const slug = `duplicate-${Date.now()}`;

      await caller.tenant.create({
        name: "First Tenant",
        slug
      });

      await expect(
        caller.tenant.create({
          name: "Second Tenant",
          slug
        })
      ).rejects.toThrow("CONFLICT");
    });

    it("should get tenant by ID", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      
      // Create a tenant first
      const created = await caller.tenant.create({
        name: "Get Test Tenant",
        slug: `get-test-${Date.now()}`
      });

      const result = await caller.tenant.getById({ id: created.id });
      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Get Test Tenant");
      expect(result).toHaveProperty("brands");
      expect(result).toHaveProperty("members");
    });

    it("should update tenant", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      
      // Create a tenant first
      const created = await caller.tenant.create({
        name: "Update Test",
        slug: `update-test-${Date.now()}`
      });

      const updated = await caller.tenant.update({
        id: created.id,
        name: "Updated Name",
        description: "Updated description"
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
    });

    it("should delete tenant without dependencies", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      
      // Create a tenant
      const created = await caller.tenant.create({
        name: "Delete Test",
        slug: `delete-test-${Date.now()}`
      });

      const result = await caller.tenant.delete({ id: created.id });
      expect(result.success).toBe(true);

      // Verify it's deleted
      await expect(caller.tenant.getById({ id: created.id })).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("Member Management", () => {
    let testTenantId: string;

    beforeEach(async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const tenant = await caller.tenant.create({
        name: "Member Test Tenant",
        slug: `member-test-${Date.now()}`
      });
      testTenantId = tenant.id;
    });

    it("should add member to tenant", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const result = await caller.tenant.addMember({
        tenantId: testTenantId,
        userEmail: `newuser-${Date.now()}@test.com`,
        role: "TENANT_ADMIN"
      });

      expect(result).toHaveProperty("id");
      expect(result.role).toBe("TENANT_ADMIN");
      expect(result.user.email).toContain("@test.com");
    });

    it("should update member role", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const email = `rolechange-${Date.now()}@test.com`;

      // Add member
      const member = await caller.tenant.addMember({
        tenantId: testTenantId,
        userEmail: email,
        role: "PLAYER"
      });

      // Update role
      const updated = await caller.tenant.setMemberRole({
        tenantId: testTenantId,
        userId: member.user.id,
        role: "TENANT_EDITOR"
      });

      expect(updated.role).toBe("TENANT_EDITOR");
    });

    it("should remove member from tenant", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const email = `remove-${Date.now()}@test.com`;

      // Add member
      const member = await caller.tenant.addMember({
        tenantId: testTenantId,
        userEmail: email,
        role: "PLAYER"
      });

      // Remove member
      const result = await caller.tenant.removeMember({
        tenantId: testTenantId,
        userId: member.user.id
      });

      expect(result.success).toBe(true);
    });
  });

  describe("List and Search", () => {
    it("should paginate tenants", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const result = await caller.tenant.list({ page: 1, limit: 5 });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.tenants.length).toBeLessThanOrEqual(5);
    });

    it("should search tenants by name", async () => {
      const caller = createCaller(createTestContext(mockSuperAdminSession));
      const uniqueName = `SearchTest-${Date.now()}`;

      await caller.tenant.create({
        name: uniqueName,
        slug: uniqueName.toLowerCase()
      });

      const result = await caller.tenant.list({ page: 1, limit: 10, search: uniqueName });
      expect(result.tenants.some((t: any) => t.name === uniqueName)).toBe(true);
    });
  });
});
