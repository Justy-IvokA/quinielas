"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@qp/ui/components/button";
import { Input } from "@qp/ui/components/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { SportsLoader } from "@qp/ui";

const SYNC_JOBS = [
  "auto-sync-fixtures",
  "leaderboard-snapshot",
  "purge-audit-logs",
  "purge-invitations",
  "purge-tokens",
  "refresh-standings",
  "lock-predictions",
  "update-live-matches",
  "score-final",
] as const;

type SyncJobKey = (typeof SYNC_JOBS)[number];

interface SyncSettings {
  [key: string]: string;
}

export function SyncSettingsForm() {
  const t = useTranslations("settings.sync");
  const [formData, setFormData] = useState<SyncSettings>({});
  const [isEditing, setIsEditing] = useState(false);

  // Fetch sync settings
  const { data: syncSettings, isLoading, refetch } = trpc.settings.getSyncSettings.useQuery();

  // Update mutation
  const updateMutation = trpc.settings.updateSyncSettings.useMutation({
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(t("saveError", { message: error.message }));
    },
  });

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (syncSettings) {
      const initialData: SyncSettings = {};
      SYNC_JOBS.forEach((job) => {
        const key = `sync:${job}:cron`;
        initialData[key] = syncSettings[key] || "";
      });
      setFormData(initialData);
    }
  }, [syncSettings]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      settings: formData,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (syncSettings) {
      const resetData: SyncSettings = {};
      SYNC_JOBS.forEach((job) => {
        const key = `sync:${job}:cron`;
        resetData[key] = syncSettings[key] || "";
      });
      setFormData(resetData);
    }
  };

  const getDefaultCron = (job: SyncJobKey): string => {
    const defaults: Record<SyncJobKey, string> = {
      "auto-sync-fixtures": "0 */6 * * *",
      "leaderboard-snapshot": "*/10 * * * *",
      "purge-audit-logs": "0 2 * * *",
      "purge-invitations": "0 3 * * *",
      "purge-tokens": "0 4 * * *",
      "refresh-standings": "0 */12 * * *",
      "lock-predictions": "* * * * *",
      "update-live-matches": "*/5 * * * *",
      "score-final": "*/5 * * * *",
    };
    return defaults[job];
  };

  function cronToMs(cron: string): number {
    const parts = cron.split(" ");
    const minute = parts[0];
    const hour = parts[1];

    // Handle common patterns
    if (minute === "*" && hour === "*") return 60 * 1000; // Every minute
    if (minute === "*/5") return 5 * 60 * 1000; // Every 5 minutes
    if (minute === "*/10") return 10 * 60 * 1000; // Every 10 minutes
    if (minute === "0" && hour === "*/6") return 6 * 60 * 60 * 1000; // Every 6 hours
    if (minute === "0" && hour === "*/12") return 12 * 60 * 60 * 1000; // Every 12 hours
    if (minute === "0" && hour === "*") return 60 * 60 * 1000; // Every hour
    if (minute === "0" && hour === "0") return 24 * 60 * 60 * 1000; // Daily

    // Default fallback
    return 60 * 1000;
  }

  function msToSecondsOrMinutes(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days} dia(s)` : hours > 0 ? `${hours} hora(s)` : minutes > 0 ? `${minutes} minuto(s)` : `${seconds} segundo(s)`;
  }

  if (isLoading) {
    return (
      <div className="backdrop-blur-md bg-card/20 border border-card/10 dark:bg-card/70 dark:border-card/80 shadow-xl rounded-lg p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <SportsLoader size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-card/20 border border-card/10 dark:bg-card/70 dark:border-card/80 shadow-xl rounded-lg p-6 mb-6 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-primary mb-2">{t("title")}</h2>
        <p className="text-sm text-accent mb-4">{t("description")}</p>

        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2 mb-2 flex gap-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{t("warning")}</p>
        </div>
      </div>

      {/* Cron Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-3">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">{t("cronHelp")}</p>
        <p className="text-sm text-blue-800 dark:text-blue-300">{t("cronExamples")}</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-2">
        {SYNC_JOBS.map((job) => {
          const key = `sync:${job}:cron`;
          const jobLabel = t(`jobs.${job}.label`);
          const jobDescription = t(`jobs.${job}.description`);
          const currentValue = formData[key] || "";
          const defaultValue = getDefaultCron(job);

          return (
            <div key={job} className="border-b border-border/50 pb-6 last:border-b-0">
              <div className="mb-1">
                <label className="block text-sm font-medium text-foreground mb-0">
                  {jobLabel}
                </label>
                <p className="text-sm text-accent mb-1">{jobDescription}</p>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={defaultValue}
                    disabled={!isEditing || updateMutation.isPending}
                    className="font-mono text-sm"
                  />
                </div>
                {!isEditing && currentValue && (
                  <span className="text-xs text-accent bg-muted px-2 py-1 rounded">
                    {msToSecondsOrMinutes(cronToMs(currentValue))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-primary hover:bg-primary/90"
          >
            {t("edit", { ns: "common" })}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save", { ns: "common" })
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              variant="outline"
            >
              {t("cancel", { ns: "common" })}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
