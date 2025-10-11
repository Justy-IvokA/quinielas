import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractTenantFromSubdomain, resolveTenantAndBrandFromHost, getBrandCanonicalUrl, buildPoolUrl } from "./host-tenant";
import type { Tenant, Brand } from "@qp/db";

// Mock prisma
vi.mock("@qp/db", () => ({
  prisma: {
    brand: {
      findFirst: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

describe("extractTenantFromSubdomain", () => {
  it("should extract tenant from subdomain", () => {
    expect(extractTenantFromSubdomain("cemex.quinielas.mx")).toBe("cemex");
    expect(extractTenantFromSubdomain("demo.quinielas.app")).toBe("demo");
    expect(extractTenantFromSubdomain("tenant123.example.com")).toBe("tenant123");
  });

  it("should return null for localhost", () => {
    expect(extractTenantFromSubdomain("localhost")).toBeNull();
  });

  it("should return null for IP addresses", () => {
    expect(extractTenantFromSubdomain("127.0.0.1")).toBeNull();
    expect(extractTenantFromSubdomain("192.168.1.1")).toBeNull();
  });

  it("should return null for domains without subdomain", () => {
    expect(extractTenantFromSubdomain("quinielas.mx")).toBeNull();
    expect(extractTenantFromSubdomain("example.com")).toBeNull();
  });

  it("should return null for common subdomains", () => {
    expect(extractTenantFromSubdomain("www.quinielas.mx")).toBeNull();
    expect(extractTenantFromSubdomain("api.quinielas.mx")).toBeNull();
    expect(extractTenantFromSubdomain("admin.quinielas.mx")).toBeNull();
  });
});

describe("getBrandCanonicalUrl", () => {
  it("should use custom domain if available", () => {
    const brand = {
      id: "brand1",
      domains: ["quinielas.cemex.com", "cemex-quinielas.mx"],
      tenant: {
        slug: "cemex",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(getBrandCanonicalUrl(brand)).toBe("https://quinielas.cemex.com");
  });

  it("should construct subdomain URL if no custom domain", () => {
    const brand = {
      id: "brand1",
      domains: [],
      tenant: {
        slug: "demo",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(getBrandCanonicalUrl(brand)).toBe("https://demo.quinielas.mx");
  });
});

describe("buildPoolUrl", () => {
  it("should build pool URL with custom domain", () => {
    const brand = {
      id: "brand1",
      domains: ["quinielas.cemex.com"],
      tenant: {
        slug: "cemex",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildPoolUrl(brand, "mundial-2026")).toBe("https://quinielas.cemex.com/mundial-2026");
  });

  it("should build pool URL with subdomain", () => {
    const brand = {
      id: "brand1",
      domains: [],
      tenant: {
        slug: "demo",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildPoolUrl(brand, "test-pool")).toBe("https://demo.quinielas.mx/test-pool");
  });
});
