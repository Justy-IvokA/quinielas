"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Users, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { Button, Badge } from "@qp/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PoolDashboardCardProps {
  pool: {
    poolId: string;
    poolSlug: string;
    title: string;
    brand: {
      name: string;
      logoUrl: string | null;
    };
    seasonLabel: string;
    status: "ACTIVE" | "FINALIZED";
    nextKickoff: string | null;
    participantCount: number;
  };
  locale: string;
}

export function PoolDashboardCard({ pool, locale }: PoolDashboardCardProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/${locale}/pools/${pool.poolSlug}/fixtures`);
  };

  const nextKickoffDate = pool.nextKickoff ? new Date(pool.nextKickoff) : null;

  return (
    <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {pool.brand.logoUrl && (
            <img
              src={pool.brand.logoUrl}
              alt={pool.brand.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{pool.title}</h3>
            <p className="text-white/60 text-sm truncate">{pool.seasonLabel}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Next Match */}
        {nextKickoffDate && (
          <div className="flex items-center gap-2 text-white/80">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-white/60">{t("card.nextMatch")}</p>
              <p className="text-sm font-medium">
                {format(nextKickoffDate, "d MMM, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center gap-2 text-white/80">
          <Users className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <p className="text-xs text-white/60">{t("card.participants")}</p>
            <p className="text-sm font-medium">{pool.participantCount}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={pool.status === "ACTIVE" ? "success" : "warning"}> {/* default = color accent(morado)*/}
            {pool.status === "ACTIVE" ? t("card.active") : t("card.finalized")}
          </Badge>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleNavigate}
          className="w-full bg-primary/20 hover:bg-primary/30 text-white border border-primary/40 group-hover:bg-primary group-hover:border-primary transition-all"
          variant="ghost"
          StartIcon={ArrowRight}
          EndIcon={ArrowLeft}
        >
          {t("card.viewFixtures")}
        </Button>
      </div>
    </div>
  );
}
