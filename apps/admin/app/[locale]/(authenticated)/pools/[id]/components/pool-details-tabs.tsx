"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Calendar, 
  Info, 
  Settings, 
  Trophy, 
  Users 
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@qp/ui";

import { PoolDetails } from "./pool-details";
import { PrizesManager } from "./prizes-manager";
import { PoolFixturesManager } from "./pool-fixtures-manager";
import { PoolRegistrations } from "./pool-registrations";
import { PoolSettings } from "./pool-settings";

interface PoolDetailsTabsProps {
  poolId: string;
}

export function PoolDetailsTabs({ poolId }: PoolDetailsTabsProps) {
  const t = useTranslations("pools.tabs");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">
          <Info className="mr-2 h-4 w-4" />
          {t("overview")}
        </TabsTrigger>
        <TabsTrigger value="fixtures">
          <Calendar className="mr-2 h-4 w-4" />
          {t("fixtures")}
        </TabsTrigger>
        <TabsTrigger value="registrations">
          <Users className="mr-2 h-4 w-4" />
          {t("registrations")}
        </TabsTrigger>
        <TabsTrigger value="prizes">
          <Trophy className="mr-2 h-4 w-4" />
          {t("prizes")}
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" />
          {t("settings")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <PoolDetails poolId={poolId} />
      </TabsContent>

      <TabsContent value="fixtures" className="mt-6">
        <PoolFixturesManager poolId={poolId} />
      </TabsContent>

      <TabsContent value="registrations" className="mt-6">
        <PoolRegistrations poolId={poolId} />
      </TabsContent>

      <TabsContent value="prizes" className="mt-6">
        <PrizesManager poolId={poolId} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <PoolSettings poolId={poolId} />
      </TabsContent>
    </Tabs>
  );
}
