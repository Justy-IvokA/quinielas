"use client";

import { useTranslations } from "next-intl";
import { DollarSign, Percent, Briefcase, Calendar, Sparkles, Gift } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@qp/ui";

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

interface PrizeCardProps {
  prize: Prize;
  compact?: boolean;
}

function getPrizeTypeIcon(type: string) {
  const icons = {
    CASH: <DollarSign className="w-4 h-4" />,
    DISCOUNT: <Percent className="w-4 h-4" />,
    SERVICE: <Briefcase className="w-4 h-4" />,
    DAY_OFF: <Calendar className="w-4 h-4" />,
    EXPERIENCE: <Sparkles className="w-4 h-4" />,
    OTHER: <Gift className="w-4 h-4" />,
  };
  return icons[type as keyof typeof icons] || icons.OTHER;
}

function getRankBadgeVariant(rank: number): "default" | "purple" | "outline" {
  if (rank === 1) return "default"; // Gold
  if (rank <= 3) return "purple"; // Silver/Bronze
  return "outline"; // Others
}

export function PrizeCard({ prize, compact = false }: PrizeCardProps) {
  const t = useTranslations("prizes");
  const tTypes = useTranslations("prizes.types");
  const tRank = useTranslations("prizes.rank");

  const rankLabel =
    prize.rankFrom === prize.rankTo
      ? tRank("single", { rank: prize.rankFrom })
      : tRank("range", { from: prize.rankFrom, to: prize.rankTo });

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10 transition-colors">
        {prize.imageUrl && (
          <img
            src={prize.imageUrl}
            alt={prize.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getRankBadgeVariant(prize.rankFrom)} className="text-xs">
              {rankLabel}
            </Badge>
            <div className="p-1 rounded-full bg-primary/10 text-primary">
              {getPrizeTypeIcon(prize.type)}
            </div>
          </div>
          <p className="font-semibold text-white truncate">{prize.title}</p>
          {prize.value && (
            <p className="text-sm font-bold text-primary">{prize.value}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-200 backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10">
      <CardHeader>
        {/* Rank badge and type icon */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant={getRankBadgeVariant(prize.rankFrom)}>
            {rankLabel}
          </Badge>

          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {getPrizeTypeIcon(prize.type)}
          </div>
        </div>

        {/* Image */}
        {prize.imageUrl && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img
              src={prize.imageUrl}
              alt={prize.title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardTitle className="text-white">{prize.title}</CardTitle>
      </CardHeader>

      <CardContent>
        {prize.description && (
          <p className="text-white/60 text-sm mb-4 line-clamp-3">
            {prize.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {prize.value && (
            <span className="text-2xl font-bold text-primary">
              {prize.value}
            </span>
          )}
          <Badge variant="outline" className="ml-auto">
            {tTypes(prize.type as any)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
