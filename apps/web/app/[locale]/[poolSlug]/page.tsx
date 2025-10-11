import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@qp/db";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";

import { PoolLanding } from "./components/pool-landing";

interface PoolPageProps {
  params: Promise<{
    locale: string;
    poolSlug: string;
  }>;
}

export async function generateMetadata({ params }: PoolPageProps): Promise<Metadata> {
  const { locale, poolSlug } = await params;
  const t = await getTranslations({ locale, namespace: "pool" });

  return {
    title: t("title", { poolSlug })
  };
}

export default async function PoolPage({ params }: PoolPageProps) {
  const { poolSlug } = await params;
  
  // Resolve tenant/brand from host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const pathname = headersList.get("x-pathname") || "";
  
  const { tenant, brand } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    notFound();
  }

  // Fetch pool with all necessary data
  const pool = await prisma.pool.findFirst({
    where: {
      slug: poolSlug,
      tenantId: tenant.id
    },
    include: {
      tenant: {
        select: { name: true, slug: true }
      },
      brand: {
        select: { name: true, slug: true, logoUrl: true, theme: true }
      },
      season: {
        select: {
          name: true,
          year: true,
          startsAt: true,
          endsAt: true,
          competition: {
            select: {
              name: true,
              logoUrl: true
            }
          }
        }
      },
      accessPolicy: true,
      prizes: {
        orderBy: { rankFrom: "asc" }
      },
      _count: {
        select: {
          registrations: true,
          predictions: true
        }
      }
    }
  });

  if (!pool) {
    notFound();
  }

  // Check if pool is expired
  // A pool is expired if:
  // 1. It has an explicit endDate that has passed
  // 2. OR the season has ended
  const now = new Date();
  const isExpired = Boolean(
    (pool.endDate && pool.endDate < now) ||
    (pool.season.endsAt && pool.season.endsAt < now)
  );

  return (
    <PoolLanding 
      pool={pool} 
      isExpired={isExpired}
      tenant={tenant}
      brand={brand}
    />
  );
}
