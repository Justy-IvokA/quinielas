"use client";

import { useState, useEffect } from "react";
import { Mail, Sparkles, Trophy } from "lucide-react";
import { InlineLoader } from "@qp/ui";
import Image from "next/image";
import { useTheme } from "next-themes";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Users, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@qp/ui/components/button";
import { Input } from "@qp/ui/components/input";
import { Checkbox } from "@qp/ui/components/checkbox";
import { Label } from "@qp/ui/components/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qp/ui/components/form";
import { Alert, AlertDescription } from "@qp/ui/components/alert";
import { trpc } from "@web/trpc";
import { CaptchaWidget, type CaptchaProvider } from "../../../signin/_components/captcha-widget";
import { RegistrationSuccessModal } from "../../../signin/_components/registration-success-modal";

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Formato inválido (ej: +525512345678)")
  .optional()
  .or(z.literal(""));

// Schema for first-time users
const publicRegistrationSchemaFull = z.object({
  displayName: z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones"
  }),
  captchaToken: z.string().optional()
});

// Schema for returning users (no personal data needed)
const publicRegistrationSchemaSimple = z.object({
  displayName: z.string().optional(),
  email: z.string().optional(),
  phone: phoneSchema,
  acceptTerms: z.boolean().optional(),
  captchaToken: z.string().optional()
});

// Use a union type that's compatible with both schemas
type PublicRegistrationFormData = z.infer<typeof publicRegistrationSchemaFull> | z.infer<typeof publicRegistrationSchemaSimple>;

interface PublicRegistrationFormProps {
  poolId: string;
  poolName: string;
  poolDescription: string | null;
  poolSlug: string;
  userId: string;
  requireCaptcha: boolean;
  captchaProvider?: CaptchaProvider;
  captchaSiteKey?: string;
  maxRegistrations?: number | null;
  currentRegistrations: number;
  registrationStartDate?: Date | null;
  registrationEndDate?: Date | null;
  termsUrl?: string;
  privacyUrl?: string;
  // Brand customization
  brandName?: string;
  brandLogo?: any;
  heroAssets?: any;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export function PublicRegistrationForm({
  poolId,
  poolName,
  poolDescription,
  poolSlug,
  userId,
  requireCaptcha,
  captchaProvider = "hcaptcha",
  captchaSiteKey,
  maxRegistrations,
  currentRegistrations,
  registrationStartDate,
  registrationEndDate,
  termsUrl,
  privacyUrl,
  brandName = "Quinielas",
  brandLogo,
  heroAssets,
  brandColors
}: PublicRegistrationFormProps) {
  const t = useTranslations("auth.registration");
  const tCommon = useTranslations("common");
  const { theme } = useTheme();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Query to check if user has any previous registrations
  const hasExistingDataQuery = trpc.registration.hasExistingData.useQuery(
    { userId },
    { 
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false
    }
  );

  const hasExistingData = hasExistingDataQuery.data?.hasData ?? false;
  
  // Sync with localStorage for offline detection
  useEffect(() => {
    if (hasExistingDataQuery.data?.hasData) {
      try {
        localStorage.setItem(`user_${userId}_has_data`, 'true');
      } catch {}
    }
  }, [hasExistingDataQuery.data, userId]);

  // Get optimized media URLs
  const optimizedCardUrl = getOptimizedMediaUrl(heroAssets?.mainCard?.url);
  const optimizedLogoUrl = getOptimizedMediaUrl(brandLogo?.url);

  const form = useForm<PublicRegistrationFormData>({
    resolver: zodResolver(hasExistingData ? publicRegistrationSchemaSimple : publicRegistrationSchemaFull),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      acceptTerms: false,
      captchaToken: ""
    }
  });

  const registerMutation = trpc.registration.registerPublic.useMutation({
    onSuccess: () => {
      try {
        localStorage.setItem(`user_${userId}_has_data`, 'true');
      } catch {}
      setShowSuccessModal(true);
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message
      });
    }
  });

  const onSubmit = (data: PublicRegistrationFormData) => {
    if (requireCaptcha && !captchaToken) {
      form.setError("root", {
        message: t("errors.captchaRequired")
      });
      return;
    }

    registerMutation.mutate({
      poolId,
      userId,
      ...(hasExistingData ? {} : {
        displayName: data.displayName,
        email: data.email,
        phone: data.phone || undefined
      }),
      captchaToken: captchaToken || undefined
    } as any);
  };

  // Check registration window
  const now = new Date();
  const isBeforeStart = registrationStartDate && now < registrationStartDate;
  const isAfterEnd = registrationEndDate && now > registrationEndDate;
  const isFull = maxRegistrations && currentRegistrations >= maxRegistrations;

  // Calculate remaining spots
  const remainingSpots = maxRegistrations
    ? maxRegistrations - currentRegistrations
    : null;

  // Calculate countdown if not started
  const getCountdown = () => {
    if (!registrationStartDate || !isBeforeStart) return null;
    
    const diff = registrationStartDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours };
  };

  const countdown = getCountdown();

  if (isBeforeStart && countdown) {
    return (
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="max-w-md w-full">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              {t("window.startsIn", {
                days: countdown.days,
                hours: countdown.hours
              })}
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (isAfterEnd) {
    return (
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("window.ended")}</AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (isFull) {
    return (
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Users className="h-4 w-4" />
            <AlertDescription>{t("errors.poolFull")}</AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Pool Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-2">{poolName}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {remainingSpots !== null && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {t("spotsRemaining", { count: remainingSpots })}
                  </span>
                </div>
              )}
              {registrationEndDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t("window.endsOn", {
                      date: registrationEndDate.toLocaleDateString()
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info message for returning users */}
          {hasExistingData && (
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
                {t("public.returningUser") || "Usaremos tu información de registro anterior"}
              </AlertDescription>
            </Alert>
          )}

          {/* Only show personal data fields for first-time users */}
          {!hasExistingData && (
            <>
              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.displayName.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fields.displayName.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.email.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("fields.email.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone (Optional) */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.phone.label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("fields.phone.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms Acceptance */}
              <FormField
                control={form.control}
                name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label>
                    {t("fields.acceptTerms.label")}{" "}
                    {termsUrl && (
                      <a
                        href={termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        {t("fields.acceptTerms.termsLink")}
                      </a>
                    )}
                    {privacyUrl && (
                      <>
                        {" "}{t("fields.acceptTerms.and")}{" "}
                        <a
                          href={privacyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {t("fields.acceptTerms.privacyLink")}
                        </a>
                      </>
                    )}
                  </Label>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
            </>
          )}

          {/* CAPTCHA */}
          {requireCaptcha && captchaSiteKey && (
            <div className="flex justify-center">
              <CaptchaWidget
                provider={captchaProvider}
                siteKey={captchaSiteKey}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
                onError={(error) => {
                  form.setError("root", {
                    message: t("errors.captchaError")
                  });
                }}
              />
            </div>
          )}

          {/* Error Display */}
          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <InlineLoader className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </Form>

      <RegistrationSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        poolName={poolName}
        poolSlug={poolSlug}
      />
    </>
  );
}
