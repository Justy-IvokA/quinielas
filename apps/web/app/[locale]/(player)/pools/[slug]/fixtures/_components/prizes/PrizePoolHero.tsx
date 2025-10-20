"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";

interface Prize {
  id: string;
  title: string;
  description: string | null;
  value: string | null;
  imageUrl: string | null;
  rankFrom: number;
  rankTo: number;
  type: string;
}

interface Pool {
  id: string;
  name: string;
  slug: string;
}

interface PrizePoolHeroProps {
  prizes: Prize[];
  pool: Pool | undefined;
}

export function PrizePoolHero({ prizes, pool }: PrizePoolHeroProps) {
  const t = useTranslations("prizes.hero");

  if (!prizes || prizes.length === 0) {
    return null;
  }

  // Get top prize (1st place)
  const topPrize = prizes.find((p) => p.rankFrom === 1) || prizes[0];

  // Count prize types
  const prizeTypes = prizes.reduce((acc, prize) => {
    acc[prize.type] = (acc[prize.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const prizeTypeSummary = Object.entries(prizeTypes)
    .map(([type, count]) => `${count} ${type.toLowerCase()}`)
    .join(", ");

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-primary/10 border border-white/20 p-8">
      {/* Background decoration */}
      {/* <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" /> */}

      <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-2 flex-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Trophy className="w-4 h-4" />
            {t("inPlay", { count: prizes.length })}
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-white">
            {topPrize?.title || t("compete")}
          </h2>

          {/* Description */}
          <p className="text-white/70 max-w-lg">
            {topPrize?.description || t("compete")}
          </p>

          {/* Value */}
          {topPrize?.value && (
            <div className="text-3xl font-bold text-primary">
              {topPrize.value}
            </div>
          )}

          {/* Prize distribution summary */}
          {/* {prizeTypeSummary && (
            <p className="text-sm text-white/60">
              {prizeTypeSummary}
            </p>
          )} */}

          {/* CTA */}
          <p className="text-accent font-medium mt-2">
            {t("keepCompeting")}
          </p>
        </div>

        {/* Image */}
        {topPrize?.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={topPrize.imageUrl}
              alt={topPrize.title}
              className="w-full md:w-48 h-48 object-cover rounded-xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
