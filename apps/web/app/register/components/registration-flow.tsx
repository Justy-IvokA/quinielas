"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@qp/ui";

import { PublicRegistrationForm } from "./public-registration-form";
import { CodeRegistrationForm } from "./code-registration-form";
import { EmailInviteRegistrationForm } from "./email-invite-registration-form";

type AccessType = "PUBLIC" | "CODE" | "EMAIL_INVITE";

export function RegistrationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessType, setAccessType] = useState<AccessType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const poolId = searchParams.get("pool") || "demo-pool-id"; // Replace with actual pool resolution
  const inviteCode = searchParams.get("code");
  const inviteToken = searchParams.get("token");

  useEffect(() => {
    // Determine access type based on URL params and pool configuration
    const determineAccessType = async () => {
      setIsLoading(true);
      try {
        if (inviteToken) {
          setAccessType("EMAIL_INVITE");
        } else if (inviteCode) {
          setAccessType("CODE");
        } else {
          // Default to PUBLIC - in production, fetch pool's access policy
          setAccessType("PUBLIC");
        }
      } catch (error) {
        console.error("Error determining access type:", error);
      } finally {
        setIsLoading(false);
      }
    };

    determineAccessType();
  }, [poolId, inviteCode, inviteToken]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Cargando...</div>;
  }

  if (!accessType) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo determinar el método de registro. Por favor, verifica tu enlace de invitación.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {accessType === "PUBLIC" && <PublicRegistrationForm poolId={poolId} />}
      {accessType === "CODE" && <CodeRegistrationForm poolId={poolId} initialCode={inviteCode} />}
      {accessType === "EMAIL_INVITE" && <EmailInviteRegistrationForm poolId={poolId} inviteToken={inviteToken!} />}
    </div>
  );
}
