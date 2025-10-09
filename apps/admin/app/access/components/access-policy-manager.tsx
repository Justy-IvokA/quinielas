"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui";

import { trpc } from "../../../src/trpc/react";
import { AccessPolicyForm } from "./access-policy-form";
import { CodeBatchManager } from "./code-batch-manager";
import { EmailInvitationManager } from "./email-invitation-manager";

export function AccessPolicyManager() {
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
    return <div className="text-muted-foreground">Cargando políticas de acceso...</div>;
  }

  if (!accessPolicy && !showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin política de acceso</CardTitle>
          <CardDescription>
            Este pool no tiene una política de acceso configurada. Crea una para comenzar a gestionar registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowCreateForm(true)} StartIcon={Plus}>
            Crear política de acceso
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nueva política de acceso</CardTitle>
          <CardDescription>Define cómo los usuarios podrán registrarse en este pool.</CardDescription>
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
          <CardTitle>Política de acceso: {accessPolicy?.pool.name}</CardTitle>
          <CardDescription>Tipo: {accessPolicy?.accessType}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requiere CAPTCHA:</span>
              <span className="font-medium">{accessPolicy?.requireCaptcha ? "Sí" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verificación de email:</span>
              <span className="font-medium">{accessPolicy?.requireEmailVerification ? "Sí" : "No"}</span>
            </div>
            {accessPolicy?.maxRegistrations && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máximo de registros:</span>
                <span className="font-medium">{accessPolicy?.maxRegistrations}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {accessPolicy?.accessType === "CODE" && (
        <Tabs defaultValue="batches" className="w-full">
          <TabsList>
            <TabsTrigger value="batches">Lotes de códigos</TabsTrigger>
          </TabsList>
          <TabsContent value="batches">
            <CodeBatchManager accessPolicyId={accessPolicy.id} />
          </TabsContent>
        </Tabs>
      )}

      {accessPolicy?.accessType === "EMAIL_INVITE" && (
        <Tabs defaultValue="invitations" className="w-full">
          <TabsList>
            <TabsTrigger value="invitations">Invitaciones por email</TabsTrigger>
          </TabsList>
          <TabsContent value="invitations">
            <EmailInvitationManager accessPolicyId={accessPolicy.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
