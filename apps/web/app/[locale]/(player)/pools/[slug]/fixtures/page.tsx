import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { authConfig } from "@qp/api/context";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getServerAuthSession } from "@qp/auth";
import { prisma } from "@qp/db";

import { FixturesView } from "./_components/FixturesView";

interface FixturesPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    filter?: string;
  }>;
}

export async function generateMetadata({ params }: FixturesPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "fixtures" });

  return {
    title: t("title", { poolSlug: slug }),
    description: t("subtitle")
  };
}

export default async function FixturesPage({ params, searchParams }: FixturesPageProps) {
  const { locale, slug } = await params;
  const search = await searchParams;

  // Resolve tenant/brand from host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const pathname = headersList.get("x-pathname") || "";

  const { tenant, brand } = await resolveTenantAndBrandFromHost(host, pathname);

  if (!tenant) {
    redirect(`/${locale}`);
  }

  // Get session - require authentication
  const session = await getServerAuthSession(authConfig);

  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/${locale}/pools/${slug}/fixtures`);
    redirect(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`);
  }

  // Get pool by slug
  const pool = await prisma.pool.findFirst({
    where: {
      slug,
      tenantId: tenant.id
    },
    select: {
      id: true,
      slug: true,
      name: true,
      seasonId: true,
      season: {
        select: {
          id: true,
          name: true,
          year: true,
          competition: {
            select: {
              name: true,
              logoUrl: true
            }
          }
        }
      },
      brand: {
        select: {
          name: true,
          logoUrl: true
        }
      }
    }
  });

  if (!pool) {
    notFound();
  }

  // Check if user is registered
  const registration = await prisma.registration.findUnique({
    where: {
      userId_poolId: {
        userId: session.user.id,
        poolId: pool.id
      }
    }
  });

  if (!registration) {
    redirect(`/${locale}/pools/${slug}`);
  }

  const filter = (search.filter?.toUpperCase() as "ALL" | "PENDING" | "LIVE" | "FINISHED") || "ALL";

  return (
    <FixturesView
      locale={locale}
      pool={pool}
      userId={session.user.id}
      initialFilter={filter}
    />
  );
}
