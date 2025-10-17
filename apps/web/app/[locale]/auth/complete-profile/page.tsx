import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authConfig } from "@qp/api/context";
import { createAuthInstance } from "@qp/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui";
import { CompleteProfileForm } from "./_components/complete-profile-form";

interface CompleteProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

async function CompleteProfileContent({ params, searchParams }: CompleteProfilePageProps) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("auth.completeProfile");

  // Check if authenticated
  const auth = createAuthInstance(authConfig);
  const session = await auth();

  if (!session?.user) {
    // Not authenticated, redirect to signin
    redirect(`/${locale}/auth/signin`);
  }

  // If profile is already complete, redirect to dashboard or callback
  if (session.user.name) {
    const finalCallbackUrl = callbackUrl || `/${locale}/dashboard`;
    redirect(finalCallbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card variant="glass" className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <CardDescription>
            {t("subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CompleteProfileForm
            userId={session.user.id}
            email={session.user.email || ""}
            callbackUrl={callbackUrl || `/${locale}/dashboard`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompleteProfilePage(props: CompleteProfilePageProps) {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CompleteProfileContent {...props} />
    </Suspense>
  );
}
