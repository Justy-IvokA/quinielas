import { describe, it, expect } from "vitest";
import {
  compareRole,
  hasRole,
  hasMinRole,
  isSuperAdmin,
  getTenantRole,
  hasTenantRole,
  hasTenantMinRole,
  getHighestRole
} from "./rbac";
import type { TenantRole } from "@qp/db";
import type { Session } from "next-auth";

describe("RBAC Helpers", () => {
  describe("compareRole", () => {
    it("should compare roles correctly", () => {
      expect(compareRole("SUPERADMIN", "TENANT_ADMIN")).toBe(1);
      expect(compareRole("TENANT_ADMIN", "TENANT_EDITOR")).toBe(1);
      expect(compareRole("TENANT_EDITOR", "PLAYER")).toBe(1);
      expect(compareRole("PLAYER", "TENANT_ADMIN")).toBe(-1);
      expect(compareRole("TENANT_ADMIN", "TENANT_ADMIN")).toBe(0);
    });
  });

  describe("hasRole", () => {
    it("should return true if user has any of the required roles", () => {
      const userRoles: TenantRole[] = ["TENANT_ADMIN", "PLAYER"];
      expect(hasRole(userRoles, ["SUPERADMIN", "TENANT_ADMIN"])).toBe(true);
      expect(hasRole(userRoles, ["PLAYER"])).toBe(true);
      expect(hasRole(userRoles, ["SUPERADMIN"])).toBe(false);
    });

    it("should return false if user has no matching roles", () => {
      const userRoles: TenantRole[] = ["PLAYER"];
      expect(hasRole(userRoles, ["SUPERADMIN", "TENANT_ADMIN"])).toBe(false);
    });
  });

  describe("hasMinRole", () => {
    it("should return true if user role meets or exceeds minimum", () => {
      expect(hasMinRole("SUPERADMIN", "TENANT_ADMIN")).toBe(true);
      expect(hasMinRole("TENANT_ADMIN", "TENANT_ADMIN")).toBe(true);
      expect(hasMinRole("TENANT_ADMIN", "PLAYER")).toBe(true);
      expect(hasMinRole("PLAYER", "TENANT_ADMIN")).toBe(false);
    });
  });

  describe("isSuperAdmin", () => {
    it("should return true for SUPERADMIN", () => {
      const session: Session = {
        user: {
          id: "1",
          email: "admin@test.com",
          highestRole: "SUPERADMIN",
          tenantRoles: {}
        },
        expires: ""
      };
      expect(isSuperAdmin(session)).toBe(true);
    });

    it("should return false for non-SUPERADMIN", () => {
      const session: Session = {
        user: {
          id: "1",
          email: "user@test.com",
          highestRole: "TENANT_ADMIN",
          tenantRoles: {}
        },
        expires: ""
      };
      expect(isSuperAdmin(session)).toBe(false);
    });

    it("should return false for null session", () => {
      expect(isSuperAdmin(null)).toBe(false);
    });
  });

  describe("getTenantRole", () => {
    it("should return user's role for specific tenant", () => {
      const session: Session = {
        user: {
          id: "1",
          email: "user@test.com",
          highestRole: "TENANT_ADMIN",
          tenantRoles: {
            "tenant-1": "TENANT_ADMIN",
            "tenant-2": "PLAYER"
          }
        },
        expires: ""
      };
      expect(getTenantRole(session, "tenant-1")).toBe("TENANT_ADMIN");
      expect(getTenantRole(session, "tenant-2")).toBe("PLAYER");
      expect(getTenantRole(session, "tenant-3")).toBe(null);
    });

    it("should return null for null session", () => {
      expect(getTenantRole(null, "tenant-1")).toBe(null);
    });
  });

  describe("hasTenantRole", () => {
    const session: Session = {
      user: {
        id: "1",
        email: "user@test.com",
        highestRole: "TENANT_ADMIN",
        tenantRoles: {
          "tenant-1": "TENANT_ADMIN",
          "tenant-2": "PLAYER"
        }
      },
      expires: ""
    };

    it("should return true if user has required role in tenant", () => {
      expect(hasTenantRole(session, "tenant-1", ["TENANT_ADMIN"])).toBe(true);
      expect(hasTenantRole(session, "tenant-2", ["PLAYER", "TENANT_EDITOR"])).toBe(true);
    });

    it("should return false if user does not have required role", () => {
      expect(hasTenantRole(session, "tenant-2", ["TENANT_ADMIN"])).toBe(false);
      expect(hasTenantRole(session, "tenant-3", ["PLAYER"])).toBe(false);
    });
  });

  describe("hasTenantMinRole", () => {
    const session: Session = {
      user: {
        id: "1",
        email: "user@test.com",
        highestRole: "TENANT_ADMIN",
        tenantRoles: {
          "tenant-1": "TENANT_ADMIN",
          "tenant-2": "PLAYER"
        }
      },
      expires: ""
    };

    it("should return true if user meets minimum role", () => {
      expect(hasTenantMinRole(session, "tenant-1", "PLAYER")).toBe(true);
      expect(hasTenantMinRole(session, "tenant-1", "TENANT_ADMIN")).toBe(true);
      expect(hasTenantMinRole(session, "tenant-2", "PLAYER")).toBe(true);
    });

    it("should return false if user does not meet minimum role", () => {
      expect(hasTenantMinRole(session, "tenant-2", "TENANT_ADMIN")).toBe(false);
      expect(hasTenantMinRole(session, "tenant-3", "PLAYER")).toBe(false);
    });
  });

  describe("getHighestRole", () => {
    it("should return highest role from list", () => {
      expect(getHighestRole(["PLAYER", "TENANT_ADMIN", "TENANT_EDITOR"])).toBe("TENANT_ADMIN");
      expect(getHighestRole(["SUPERADMIN", "TENANT_ADMIN"])).toBe("SUPERADMIN");
      expect(getHighestRole(["PLAYER"])).toBe("PLAYER");
    });

    it("should return null for empty list", () => {
      expect(getHighestRole([])).toBe(null);
    });
  });
});
