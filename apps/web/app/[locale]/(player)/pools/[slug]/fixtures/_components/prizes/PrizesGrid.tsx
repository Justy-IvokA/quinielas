"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { PrizeCard } from "./PrizeCard";

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

interface PrizesGridProps {
  prizes: Prize[];
}

export function PrizesGrid({ prizes }: PrizesGridProps) {
  const t = useTranslations("prizes.grid");
  const tEmpty = useTranslations("prizes.empty");

  if (!prizes || prizes.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-24 h-24 mx-auto text-white/20 mb-6" />
        <h3 className="text-2xl font-semibold text-white mb-2">
          {tEmpty("title")}
        </h3>
        <p className="text-white/60 max-w-md mx-auto">
          {tEmpty("description")}
        </p>
      </div>
    );
  }

  // Sort prizes by rank (1st place first)
  const sortedPrizes = [...prizes].sort((a, b) => a.rankFrom - b.rankFrom);

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-accent">
          {t("title")}
        </h3>
        <p className="text-accent">
          {t("subtitle")}
        </p>
      </div>

      {/* Grid of prizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPrizes.map((prize) => (
          <PrizeCard key={prize.id} prize={prize} />
        ))}
      </div>
    </div>
  );
}
