"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [tenantId, setTenantId] = useState<string>("");

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
            Please select a tenant from the navigation to manage settings.
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
        <h2 className="text-xl font-semibold mb-4">Anti-Abuse Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Captcha Level
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={(settings?.["antiAbuse.captchaLevel"] as string) ?? "auto"}
              onChange={(e) => handleSaveCaptchaLevel(e.target.value)}
              disabled={upsertMutation.isPending}
            >
              <option value="off">Off</option>
              <option value="auto">Auto (on anomaly)</option>
              <option value="force">Force (always)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Controls when CAPTCHA is required during registration
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">IP Logging</label>
              <p className="text-sm text-gray-500">
                Store IP addresses in audit logs and consent records
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
              <label className="block text-sm font-medium">Cookie Banner</label>
              <p className="text-sm text-gray-500">
                Show cookie/privacy banner on public pools
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
                Device Fingerprinting
              </label>
              <p className="text-sm text-gray-500">
                Enable device fingerprinting for fraud detection
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
          <strong>Note:</strong> These settings override global defaults for this
          tenant. Pool-specific overrides can be configured per pool.
        </p>
      </div>
    </div>
  );
}
