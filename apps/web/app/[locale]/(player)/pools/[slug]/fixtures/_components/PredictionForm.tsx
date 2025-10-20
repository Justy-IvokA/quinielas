"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Lock, Unlock } from "lucide-react";
import { InlineLoader } from "@qp/ui";
import { Button, Input, Label } from "@qp/ui";
import { trpc } from "@web/trpc";
import { toast } from "sonner";

const predictionSchema = z.object({
  homeScore: z.number().min(0).max(99),
  awayScore: z.number().min(0).max(99)
});

type PredictionFormData = z.infer<typeof predictionSchema>;

interface PredictionFormProps {
  matchId: string;
  poolId: string;
  homeTeamName: string;
  awayTeamName: string;
  initialHomeScore?: number;
  initialAwayScore?: number;
}

export function PredictionForm({
  matchId,
  poolId,
  homeTeamName,
  awayTeamName,
  initialHomeScore = 0,
  initialAwayScore = 0
}: PredictionFormProps) {
  const t = useTranslations("predictions");
  const utils = trpc.useUtils();

  const [isEditing, setIsEditing] = useState(initialHomeScore === 0 && initialAwayScore === 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      homeScore: initialHomeScore,
      awayScore: initialAwayScore
    }
  });

  const saveMutation = trpc.predictions.save.useMutation({
    onSuccess: () => {
      toast.success(t("saved"));
      setIsEditing(false);
      // Invalidate queries
      void utils.predictions.getByPool.invalidate({ poolId });
    },
    onError: (error) => {
      if (error.message === "MATCH_LOCKED") {
        toast.error(t("errors.matchLocked"));
      } else {
        toast.error(t("errors.saveFailed"));
      }
    }
  });

  const onSubmit = (data: PredictionFormData) => {
    saveMutation.mutate({
      matchId,
      poolId,
      homeScore: data.homeScore,
      awayScore: data.awayScore
    });
  };

  if (!isEditing && initialHomeScore !== 0 && initialAwayScore !== 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
      >
        {t("edit")}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Home Score */}
        <div>
          <Label htmlFor={`home-${matchId}`} className="text-white/70 text-xs mb-1">
            {homeTeamName}
          </Label>
          <Input
            id={`home-${matchId}`}
            type="number"
            min="0"
            max="99"
            {...register("homeScore", { valueAsNumber: true })}
            className="bg-white/10 border-white/20 text-white text-center text-lg font-bold"
            disabled={saveMutation.isPending}
          />
          {errors.homeScore && (
            <p className="text-red-400 text-xs mt-1">{errors.homeScore.message}</p>
          )}
        </div>

        {/* Away Score */}
        <div>
          <Label htmlFor={`away-${matchId}`} className="text-white/70 text-xs mb-1">
            {awayTeamName}
          </Label>
          <Input
            id={`away-${matchId}`}
            type="number"
            min="0"
            max="99"
            {...register("awayScore", { valueAsNumber: true })}
            className="bg-white/10 border-white/20 text-white text-center text-lg font-bold"
            disabled={saveMutation.isPending}
          />
          {errors.awayScore && (
            <p className="text-red-400 text-xs mt-1">{errors.awayScore.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!isDirty || saveMutation.isPending}
          className="flex-1 bg-primary hover:bg-primary/90"
          StartIcon={saveMutation.isPending ? InlineLoader : Save}
        >
          {saveMutation.isPending ? (
            <>
              {t("saving")}
            </>
          ) : (
            <>
              {t("save")}
            </>
          )}
        </Button>
        {isEditing && initialHomeScore !== 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
