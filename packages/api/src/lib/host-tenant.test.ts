import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractTenantFromSubdomain, buildAuthCallbackUrl, buildInvitationUrl, getBrandCanonicalUrl, buildPoolUrl } from "./host-tenant";
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
      slug: "demo-brand",
      domains: [],
      tenant: {
        slug: "demo",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(getBrandCanonicalUrl(brand)).toBe("http://demo.localhost:3000");
  });

  it("should handle localhost domains correctly", () => {
    const brand = {
      id: "brand1",
      slug: "cocacola",
      domains: ["cocacola.localhost"],
      tenant: {
        slug: "ivoka",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(getBrandCanonicalUrl(brand)).toBe("http://cocacola.localhost");
  });
});

describe("buildPoolUrl", () => {
  it("should build pool URL with custom domain and locale", () => {
    const brand = {
      id: "brand1",
      slug: "cemex-brand",
      domains: ["quinielas.cemex.com"],
      tenant: {
        slug: "cemex",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildPoolUrl(brand, "mundial-2026")).toBe("https://quinielas.cemex.com/es-MX/pools/mundial-2026");
  });

  it("should build pool URL with subdomain and custom locale", () => {
    const brand = {
      id: "brand1",
      slug: "demo-brand",
      domains: [],
      tenant: {
        slug: "demo",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildPoolUrl(brand, "test-pool", "en-US")).toBe("http://demo.localhost:3000/en-US/pools/test-pool");
  });
});

describe("buildInvitationUrl", () => {
  it("should build invitation URL with token", () => {
    const brand = {
      id: "brand1",
      slug: "cocacola",
      domains: ["cocacola.localhost"],
      tenant: {
        slug: "ivoka",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildInvitationUrl(brand, "mundial-2026", "abc123token")).toBe(
      "http://cocacola.localhost/es-MX/auth/register/mundial-2026?token=abc123token"
    );
  });
});

describe("buildAuthCallbackUrl", () => {
  it("should build auth callback URL for brand", () => {
    const brand = {
      id: "brand1",
      slug: "pepsi",
      domains: ["pepsi.localhost"],
      tenant: {
        slug: "ivoka",
      },
    } as Partial<Brand> & { tenant: Partial<Tenant> } as Brand & { tenant: Tenant };

    expect(buildAuthCallbackUrl(brand)).toBe("http://pepsi.localhost/es-MX/auth/callback");
  });
});
