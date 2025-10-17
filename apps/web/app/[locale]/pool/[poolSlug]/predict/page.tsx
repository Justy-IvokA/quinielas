import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@qp/db";
import { authConfig } from "@qp/api/context";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getServerAuthSession } from "@qp/auth";
import { assertRegistrationAccess } from "@qp/api/middleware/require-registration";

import { PredictionsView } from "./_components/predictions-view";

interface PredictPageProps {
  params: Promise<{
    locale: string;
    poolSlug: string;
  }>;
}

export async function generateMetadata({ params }: PredictPageProps): Promise<Metadata> {
  const { locale, poolSlug } = await params;
  const t = await getTranslations({ locale, namespace: "predictions" });

  return {
    title: t("title", { poolSlug })
  };
}

export default async function PredictPage({ params }: PredictPageProps) {
  const { poolSlug } = await params;
  
  // Resolve tenant/brand from host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const pathname = headersList.get("x-pathname") || "";
  
  const { tenant } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    notFound();
  }

  // Get session
  const session = await getServerAuthSession(authConfig);
  
  if (!session?.user) {
    redirect(`/${poolSlug}?error=auth_required`);
  }

  // Fetch pool
  const pool = await prisma.pool.findFirst({
    where: {
      slug: poolSlug,
      tenantId: tenant.id
    },
    include: {
      season: {
        select: {
          id: true,
          name: true,
          year: true,
          endsAt: true,
          competition: {
            select: {
              name: true
            }
          }
        }
      },
      accessPolicy: true
    }
  });

  if (!pool) {
    notFound();
  }

  // Verify registration and access rights
  try {
    await assertRegistrationAccess({
      poolId: pool.id,
      userId: session.user.id,
      tenantId: tenant.id
    });
  } catch (error: any) {
    // Redirect to pool landing with error message
    const errorCode = error.message || "access_denied";
    redirect(`/${poolSlug}?error=${errorCode}`);
  }

  // Check if pool is finalized
  const now = new Date();
  const isFinalized = Boolean(
    (pool.endDate && pool.endDate < now) ||
    (pool.season && pool.season.endsAt && pool.season.endsAt < now)
  );

  if (isFinalized) {
    redirect(`/pool/${poolSlug}/participants`);
  }

  return (
    <PredictionsView 
      poolId={pool.id}
      poolSlug={pool.slug}
      poolName={pool.name}
      seasonId={pool.season.id}
      seasonName={pool.season.name}
      competitionName={pool.season.competition.name}
    />
  );
}
