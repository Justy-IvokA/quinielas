"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input, Label } from "@qp/ui";
import { Info, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";

interface StepScoringRulesProps {
  onSubmit: (data: {
    exactScore: number;
    correctSign: number;
    goalDiffBonus: number;
  }) => void;
  initialData?: {
    exactScore: number;
    correctSign: number;
    goalDiffBonus: number;
  };
}

export function StepScoringRules({ onSubmit, initialData }: StepScoringRulesProps) {
  const t = useTranslations("superadmin.templates.create.wizard.steps.rules");
  
  const [formData, setFormData] = useState({
    exactScore: initialData?.exactScore ?? 5,
    correctSign: initialData?.correctSign ?? 3,
    goalDiffBonus: initialData?.goalDiffBonus ?? 1
  });

  useEffect(() => {
    onSubmit(formData);
  }, [formData]);

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("hint")}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="exactScore" className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {t("exactScoreLabel")}
          </Label>
          <Input
            id="exactScore"
            type="number"
            value={formData.exactScore}
            onChange={(e) => setFormData({ ...formData, exactScore: parseInt(e.target.value) || 0 })}
            min="0"
            max="100"
          />
          <p className="text-xs text-muted-foreground">{t("exactScoreHint")}</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="correctSign" className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-blue-500" />
            {t("correctSignLabel")}
          </Label>
          <Input
            id="correctSign"
            type="number"
            value={formData.correctSign}
            onChange={(e) => setFormData({ ...formData, correctSign: parseInt(e.target.value) || 0 })}
            min="0"
            max="100"
          />
          <p className="text-xs text-muted-foreground">{t("correctSignHint")}</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goalDiffBonus" className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-500" />
            {t("goalDiffBonusLabel")}
          </Label>
          <Input
            id="goalDiffBonus"
            type="number"
            value={formData.goalDiffBonus}
            onChange={(e) => setFormData({ ...formData, goalDiffBonus: parseInt(e.target.value) || 0 })}
            min="0"
            max="100"
          />
          <p className="text-xs text-muted-foreground">{t("goalDiffBonusHint")}</p>
        </div>
      </div>

      {/* Example */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-medium mb-3">{t("exampleTitle")}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("exampleExact")}:</span>
            <span className="font-semibold text-yellow-600 dark:text-yellow-500">
              +{formData.exactScore} {t("points")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("exampleSign")}:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-500">
              +{formData.correctSign} {t("points")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("exampleDiff")}:</span>
            <span className="font-semibold text-green-600 dark:text-green-500">
              +{formData.goalDiffBonus} {t("points")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
