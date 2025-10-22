"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import { useTenantId } from "@admin/providers/brand-context";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tenantId = useTenantId();

  // Fetch effective settings
  const { data: settings, isLoading, refetch } = trpc.settings.effective.useQuery(
    { tenantId: tenantId || undefined },
    { enabled: !!tenantId }
  );

  // Upsert mutation
  const upsertMutation = trpc.settings.upsert.useMutation({
    onSuccess: () => {
      toast.success(t("settingsSaved"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveCaptchaLevel = (value: string) => {
    if (!tenantId) return;
    upsertMutation.mutate({
      scope: "TENANT",
      tenantId,
      key: "antiAbuse.captchaLevel",
      value,
    });
  };

  const handleSaveIpLogging = (value: boolean) => {
    if (!tenantId) return;
    upsertMutation.mutate({
      scope: "TENANT",
      tenantId,
      key: "privacy.ipLogging",
      value,
    });
  };

  const handleSaveCookieBanner = (value: boolean) => {
    if (!tenantId) return;
    upsertMutation.mutate({
      scope: "TENANT",
      tenantId,
      key: "privacy.cookieBanner",
      value,
    });
  };

  const handleSaveDeviceFingerprint = (value: boolean) => {
    if (!tenantId) return;
    upsertMutation.mutate({
      scope: "TENANT",
      tenantId,
      key: "privacy.deviceFingerprint",
      value,
    });
  };

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {t("selectTenant")}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      {/* Anti-Abuse Settings */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("antiAbuse.title")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("antiAbuse.captchaLevel.label")}
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={(settings?.["antiAbuse.captchaLevel"] as string) ?? "auto"}
              onChange={(e) => handleSaveCaptchaLevel(e.target.value)}
              disabled={upsertMutation.isPending}
            >
              <option value="off">{t("antiAbuse.captchaLevel.off")}</option>
              <option value="auto">{t("antiAbuse.captchaLevel.auto")}</option>
              <option value="force">{t("antiAbuse.captchaLevel.force")}</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {t("antiAbuse.captchaLevel.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("privacy.title")}</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">{t("privacy.ipLogging.label")}</label>
              <p className="text-sm text-gray-500">
                {t("privacy.ipLogging.description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={(settings?.["privacy.ipLogging"] as boolean) ?? true}
                onChange={(e) => handleSaveIpLogging(e.target.checked)}
                disabled={upsertMutation.isPending}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">{t("privacy.cookieBanner.label")}</label>
              <p className="text-sm text-gray-500">
                {t("privacy.cookieBanner.description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={(settings?.["privacy.cookieBanner"] as boolean) ?? true}
                onChange={(e) => handleSaveCookieBanner(e.target.checked)}
                disabled={upsertMutation.isPending}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">
                {t("privacy.deviceFingerprint.label")}
              </label>
              <p className="text-sm text-gray-500">
                {t("privacy.deviceFingerprint.description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={
                  (settings?.["privacy.deviceFingerprint"] as boolean) ?? false
                }
                onChange={(e) => handleSaveDeviceFingerprint(e.target.checked)}
                disabled={upsertMutation.isPending}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>
          {t("note")}
        </p>
      </div>
    </div>
  );
}
