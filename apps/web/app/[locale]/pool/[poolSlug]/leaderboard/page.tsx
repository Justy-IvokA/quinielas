import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@qp/db";

import { LeaderboardView } from "./components/leaderboard-view";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; poolSlug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pool.leaderboard" });

  return {
    title: t("title")
  };
}

export default async function PoolLeaderboardPage({
  params
}: {
  params: Promise<{ poolSlug: string }>;
}) {
  const { poolSlug } = await params;
  const pool = await prisma.pool.findFirst({
    where: { slug: poolSlug },
    include: {
      season: {
        include: {
          competition: true
        }
      }
    }
  });

  if (!pool) {
    notFound();
  }

  return <LeaderboardView pool={pool} />;
}
