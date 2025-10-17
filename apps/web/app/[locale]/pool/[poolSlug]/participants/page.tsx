import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@qp/db";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";

import { ParticipantsView } from "./_components/participants-view";

interface ParticipantsPageProps {
  params: Promise<{
    locale: string;
    poolSlug: string;
  }>;
}

export async function generateMetadata({ params }: ParticipantsPageProps): Promise<Metadata> {
  const { locale, poolSlug } = await params;
  const t = await getTranslations({ locale, namespace: "participants" });

  return {
    title: t("title", { poolSlug })
  };
}

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
  const { poolSlug } = await params;
  
  // Resolve tenant/brand from host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const pathname = headersList.get("x-pathname") || "";
  
  const { tenant } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    notFound();
  }

  // Fetch pool
  const pool = await prisma.pool.findFirst({
    where: {
      slug: poolSlug,
      tenantId: tenant.id
    },
    select: {
      id: true,
      name: true,
      slug: true,
      endDate: true,
      season: {
        select: {
          name: true,
          year: true,
          endsAt: true,
          competition: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!pool) {
    notFound();
  }

  // Check if pool is finalized
  const now = new Date();
  const isFinalized = Boolean(
    (pool.endDate && pool.endDate < now) ||
    (pool.season.endsAt && pool.season.endsAt < now)
  );

  return (
    <ParticipantsView 
      poolId={pool.id}
      poolSlug={pool.slug}
      poolName={pool.name}
      seasonName={pool.season.name}
      competitionName={pool.season.competition.name}
      isFinalized={isFinalized}
    />
  );
}
