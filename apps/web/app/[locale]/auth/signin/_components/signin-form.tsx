"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui/components/card";
import { Separator } from "@qp/ui/components/separator";
import { EmailForm } from "./email-form";
import { OAuthButtons } from "./oauth-buttons";
import { LegalNotice } from "./legal-notice";

interface SignInFormProps {
  callbackUrl: string;
  requireCaptcha: boolean;
  providers: string[];
  error?: string;
}

export function SignInForm({ 
  callbackUrl, 
  requireCaptcha, 
  providers,
  error
}: SignInFormProps) {
  const t = useTranslations("auth.signin");
  const oauthProviders = providers.filter((p) => p !== "email");
  const hasEmail = providers.includes("email");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card variant="glass" className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Magic Link Form */}
            {hasEmail && (
              <EmailForm
                callbackUrl={callbackUrl}
                requireCaptcha={requireCaptcha}
              />
            )}

            {/* Divider */}
            {hasEmail && oauthProviders.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                </div>
              </div>
            )}

            {/* OAuth Buttons */}
            <OAuthButtons
              callbackUrl={callbackUrl}
              providers={oauthProviders}
            />

            {/* Legal Notice */}
            <LegalNotice />

            {/* Error Display */}
            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
