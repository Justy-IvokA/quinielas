"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui";

import { trpc } from "@admin/trpc";
import { AccessPolicyForm } from "./access-policy-form";
import { CodeBatchManager } from "./code-batch-manager";
import { EmailInvitationManager } from "./email-invitation-manager";

export function AccessPolicyManager() {
  const t = useTranslations("access");
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock pool selection for demo - replace with actual pool selector
  const demoPoolId = "demo-pool-id";
  const demoTenantId = "demo-tenant-id";

  const { data: accessPolicy, isLoading } = trpc.access.getByPoolId.useQuery(
    { poolId: demoPoolId },
    { enabled: !!demoPoolId }
  );

  if (isLoading) {
    return <div className="text-muted-foreground">{t("loadingPolicies")}</div>;
  }

  if (!accessPolicy && !showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("noPolicy.title")}</CardTitle>
          <CardDescription>{t("noPolicy.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowCreateForm(true)} StartIcon={Plus}>
            {t("noPolicy.cta")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("newPolicy.title")}</CardTitle>
          <CardDescription>{t("newPolicy.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccessPolicyForm poolId={demoPoolId} tenantId={demoTenantId} onSuccess={() => setShowCreateForm(false)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("policy.heading", { name: accessPolicy?.pool.name ?? "" })}</CardTitle>
          <CardDescription>
            {t("policy.type")} {t(`policy.typeValue.${accessPolicy?.accessType ?? "PUBLIC"}`)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("policy.requireCaptcha")}</span>
              <span className="font-medium">{accessPolicy?.requireCaptcha ? t("policy.yes") : t("policy.no")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("policy.requireEmailVerification")}</span>
              <span className="font-medium">{accessPolicy?.requireEmailVerification ? t("policy.yes") : t("policy.no")}</span>
            </div>
            {accessPolicy?.maxRegistrations && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("policy.maxRegistrations")}</span>
                <span className="font-medium">{accessPolicy?.maxRegistrations}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {accessPolicy?.accessType === "CODE" && (
        <Tabs defaultValue="batches" className="w-full">
          <TabsList>
            <TabsTrigger value="batches">{t("tabs.batches")}</TabsTrigger>
          </TabsList>
          <TabsContent value="batches">
            <CodeBatchManager accessPolicyId={accessPolicy.id} />
          </TabsContent>
        </Tabs>
      )}

      {accessPolicy?.accessType === "EMAIL_INVITE" && (
        <Tabs defaultValue="invitations" className="w-full">
          <TabsList>
            <TabsTrigger value="invitations">{t("tabs.invitations")}</TabsTrigger>
          </TabsList>
          <TabsContent value="invitations">
            <EmailInvitationManager accessPolicyId={accessPolicy.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
