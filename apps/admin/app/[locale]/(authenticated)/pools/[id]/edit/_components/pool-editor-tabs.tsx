"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui";

import { GeneralForm } from "./general-form";
import { AccessForm } from "./access-form";
import { PrizesTable } from "./prizes-table";
import { SettingsForm } from "./settings-form";
import { FixturesInfo } from "./fixtures-info";

interface PoolEditorTabsProps {
  poolId: string;
}

export function PoolEditorTabs({ poolId }: PoolEditorTabsProps) {
  const t = useTranslations("pools.edit.tabs");

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">{t("general")}</TabsTrigger>
        <TabsTrigger value="access">{t("access")}</TabsTrigger>
        <TabsTrigger value="prizes">{t("prizes")}</TabsTrigger>
        <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
        <TabsTrigger value="fixtures">{t("fixtures")}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6">
        <GeneralForm poolId={poolId} />
      </TabsContent>

      <TabsContent value="access" className="mt-6">
        <AccessForm poolId={poolId} />
      </TabsContent>

      <TabsContent value="prizes" className="mt-6">
        <PrizesTable poolId={poolId} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <SettingsForm poolId={poolId} />
      </TabsContent>

      <TabsContent value="fixtures" className="mt-6">
        <FixturesInfo poolId={poolId} />
      </TabsContent>
    </Tabs>
  );
}
