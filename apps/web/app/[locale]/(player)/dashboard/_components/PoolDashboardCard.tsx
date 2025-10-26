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
    competition: {
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
    <div className="backdrop-blur-md bg-card/20 dark:bg-card/70 border border-card/10 dark:border-card/80 shadow-xl rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-card/50 to-card/10 p-4 border-b border-card/10">
        <div className="flex items-center gap-3">
          <img
            src={pool.competition.logoUrl ? pool.competition.logoUrl : pool.brand.logoUrl || ""}
            alt={pool.brand.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-primary dark:text-secondary font-bold truncate">{pool.title}</h3>
            <p className="text-accent text-sm truncate">{pool.seasonLabel}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Next Match */}
        {nextKickoffDate && (
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4 text-primary dark:text-secondary" />
            <div className="flex-1">
              <p className="text-xs text-primary dark:text-secondary">{t("card.nextMatch")}</p>
              <p className="text-sm font-medium">
                {format(nextKickoffDate, "d MMM, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center gap-2 text-foreground">
          <Users className="w-4 h-4 text-primary dark:text-secondary" />
          <div className="flex-1">
            <p className="text-xs text-primary dark:text-secondary">{t("card.participants")}</p>
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
          className="w-full bg-card/20 dark:bg-card/70 hover:bg-primary/70 hover:dark:bg-secondary/70 text-foreground border border-card/30 dark:border-card/80 transition-all"
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
