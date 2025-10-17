import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { prisma } from "@qp/db";

import { FixturesAndPredictions } from "./components/fixtures-and-predictions";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; poolSlug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pool.fixtures" });

  return {
    title: t("title")
  };
}

export default async function PoolFixturesPage({
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
      },
      accessPolicy: true
    }
  });

  if (!pool) {
    notFound();
  }

  return <FixturesAndPredictions pool={pool} />;
}
