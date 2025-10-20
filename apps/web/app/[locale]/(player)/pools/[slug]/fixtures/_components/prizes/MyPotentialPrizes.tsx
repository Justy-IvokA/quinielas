"use client";

import { useTranslations } from "next-intl";
import { Star, Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@qp/ui";
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

interface MyPotentialPrizesProps {
  myRank: number | null;
  prizes: Prize[];
  poolSlug: string;
}

export function MyPotentialPrizes({ myRank, prizes, poolSlug }: MyPotentialPrizesProps) {
  const t = useTranslations("prizes.myChances");
  const tEmpty = useTranslations("prizes.empty");

  // If user is not registered or has no rank
  if (!myRank) {
    return (
      <Card variant="outline" className="border-dashed bg-white/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-white/50 mb-4" />
            <p className="text-white/70 mb-4">
              {tEmpty("notRegistered")}
            </p>
            <Button asChild>
              <a href={`/pools/${poolSlug}/register`}>
                {tEmpty("registerButton")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find prizes user can win based on current rank
  const potentialPrizes = prizes.filter((prize) => {
    return myRank >= prize.rankFrom && myRank <= prize.rankTo;
  });

  // Find next prize tier (within 5 spots)
  const nextPrize = prizes.find((prize) => {
    return myRank > prize.rankTo && myRank <= prize.rankTo + 5;
  });

  // Calculate progress to next prize
  const calculateProgress = (currentRank: number, targetRank: number) => {
    const distance = currentRank - targetRank;
    const maxDistance = 5;
    return Math.max(0, Math.min(100, ((maxDistance - distance) / maxDistance) * 100));
  };

  return (
    <Card className="backdrop-blur-md bg-primary/10 border border-white/20 p-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Star className="w-5 h-5 text-yellow-500" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {potentialPrizes.length > 0 ? (
          <div className="space-y-4">
            {/* In prize zone */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {t("inZone")}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("currentRank", { rank: myRank })}
                </p>
              </div>
            </div>

            {/* List of potential prizes */}
            <div className="space-y-2">
              {potentialPrizes.map((prize) => (
                <PrizeCard key={prize.id} prize={prize} compact />
              ))}
            </div>
          </div>
        ) : nextPrize ? (
          <div className="space-y-4">
            {/* Close to prize zone */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {t("close", { rank: nextPrize.rankTo })}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t("currentRank", { rank: myRank })}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>Tu posición: #{myRank}</span>
                <span>Meta: #{nextPrize.rankTo}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{ width: `${calculateProgress(myRank, nextPrize.rankTo)}%` }}
                />
              </div>
              <p className="text-sm text-white/60">
                {t("spotsAway", { count: myRank - nextPrize.rankTo })}
              </p>
            </div>

            {/* Next prize card */}
            <PrizeCard prize={nextPrize} compact />
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/70 mb-2">
              {t("improve")}
            </p>
            <p className="text-sm text-white/50">
              {t("topClassify", { count: prizes[prizes.length - 1]?.rankTo || 10 })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
