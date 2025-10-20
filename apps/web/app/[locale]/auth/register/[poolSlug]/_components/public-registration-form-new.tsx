"use client";

import { useState } from "react";
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

const publicRegistrationSchema = z.object({
  displayName: z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones"
  }),
  captchaToken: z.string().optional()
});

type PublicRegistrationFormData = z.infer<typeof publicRegistrationSchema>;

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

  // Get optimized media URLs
  const optimizedCardUrl = getOptimizedMediaUrl(heroAssets?.mainCard?.url);
  const optimizedLogoUrl = getOptimizedMediaUrl(brandLogo?.url);

  const form = useForm<PublicRegistrationFormData>({
    resolver: zodResolver(publicRegistrationSchema),
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
      displayName: data.displayName,
      email: data.email,
      phone: data.phone || undefined,
      captchaToken: captchaToken || undefined
    });
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
      {/* Full screen background with brand colors */}
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        
        {/* Registration Card */}
        <div className="relative w-full max-w-5xl">
          <div className="grid md:grid-cols-[45%,55%] rounded-2xl overflow-hidden shadow-2xl h-auto md:h-[65vh] md:min-h-[500px] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">

            {/* Floating badges - Hidden on mobile */}
            <div className="hidden md:block absolute -top-10 -left-10 px-4 py-2 rounded-full bg-gradient-to-r from-secondary to-accent shadow-lg backdrop-blur-xl animate-bounce">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden md:block absolute -bottom-12 -right-12 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-primary shadow-lg backdrop-blur-xl animate-bounce">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            
            {/* LEFT SIDE - Hero Image/Video */}
            <div className="relative h-80 md:h-auto bg-gradient-to-br from-primary to-accent group overflow-hidden">
              {optimizedCardUrl ? (
                heroAssets?.mainCard?.kind === "video" ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={optimizedCardUrl} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={optimizedCardUrl}
                    alt={poolName}
                    className="object-cover"
                    fill
                    priority
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Trophy className="w-32 h-32 text-primary-foreground/80" strokeWidth={1.5} />
                </div>
              )}
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
              
              {/* Hover Overlay with Tech Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-accent/95 to-secondary/95 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px] animate-[grid_20s_linear_infinite]" />
                </div>
                
                {/* Animated corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white/40 animate-pulse" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-white/40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-white/40 animate-pulse" style={{ animationDelay: '1.5s' }} />
                
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-[scan_3s_ease-in-out_infinite]" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-md px-4 animate-[fadeIn_0.5s_ease-out]">
                  <p className="text-sm md:text-2xl leading-relaxed font-medium drop-shadow-lg line-clamp-7 md:line-clamp-none">
                    {heroAssets?.text?.paragraph || t("public.defaultParagraph") || "¡Únete a esta quiniela pública y compite con otros participantes! Demuestra tus conocimientos deportivos."}
                  </p>
                </div>
              </div>
              
              {/* Content overlay */}
              {
                heroAssets?.text?.title && (
                  <div className="absolute top-2 md:top-4 left-0 right-0 text-center text-white px-4">
                    <h2 className="text-xl md:text-4xl font-bold mb-0 text-secondary drop-shadow-lg line-clamp-2">
                      {heroAssets.text.title}
                    </h2>
                  </div>
                )
              }
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 text-white">
                <h2 className="text-lg md:text-3xl font-bold mb-0 text-primary line-clamp-1">
                  {poolName}
                </h2>
                <p className="text-xs md:text-base text-white/90 line-clamp-2">
                  {poolDescription || "Registro público abierto"}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Registration Form */}
            <div className="p-4 md:p-6 flex flex-col justify-center backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-l border-white/20 dark:border-gray-700/50 overflow-y-auto max-h-[calc(100vh-2rem)] md:max-h-[65vh]">
              {optimizedLogoUrl && (
              <div className="flex items-center justify-center mb-3 md:mb-6">
                <Image
                  src={optimizedLogoUrl}
                  alt={poolName}
                  width={300}
                  height={300}
                  priority
                  className={`object-contain w-48 md:w-auto ${theme === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''}`}
                />
              </div>
              )}
              {heroAssets?.text?.slogan && (
                <div className="text-[10px] md:text-xs font-bold text-secondary text-center -mt-3 md:-mt-6 mb-3 md:mb-6 line-clamp-2">
                  {heroAssets.text.slogan}
                </div>
              )}
              {heroAssets?.text?.description && (
                <div className="text-sm md:text-2xl font-bold text-foreground text-justify mb-2 md:mb-4 line-clamp-5 md:line-clamp-none">
                  {heroAssets.text.description}
                </div>
              )}
              <div className="mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-accent mb-1">
                  {t("public.formTitle") || "Registro Público"}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t("public.description") || "Completa tu información para unirte"}
                </p>
                {/* Pool Info Stats */}
                {(remainingSpots !== null || registrationEndDate) && (
                  <div className="flex items-center gap-3 mt-2 text-[10px] md:text-xs text-muted-foreground">
                    {remainingSpots !== null && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {t("spotsRemaining", { count: remainingSpots }) || `${remainingSpots} lugares`}
                        </span>
                      </div>
                    )}
                    {registrationEndDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {t("window.endsOn", {
                            date: registrationEndDate.toLocaleDateString()
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 md:space-y-4">

                  {/* Display Name */}
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm font-medium">{t("fields.displayName.label") || "Nombre Completo"}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("fields.displayName.placeholder") || "ej: Lindsey Wilson"}
                            className="h-9 md:h-10 text-sm"
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
                        <FormLabel className="text-xs md:text-sm font-medium">{t("fields.email.label") || "Tu Email"}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t("fields.email.placeholder") || "example@email.com"}
                            className="h-9 md:h-10 text-sm"
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
                        <FormLabel className="text-xs md:text-sm font-medium">{t("fields.phone.label") || "Teléfono (Opcional)"}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={t("fields.phone.placeholder") || "+52 55 1234 5678"}
                            className="h-9 md:h-10 text-sm"
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
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label className="text-[10px] md:text-xs text-muted-foreground cursor-pointer">
                            {t("fields.acceptTerms.label") || "Al registrarte, aceptas los"}{" "}
                            {termsUrl && (
                              <a
                                href={termsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/80"
                              >
                                {t("fields.acceptTerms.termsLink") || "Términos de Servicio"}
                              </a>
                            )}
                            {privacyUrl && (
                              <>
                                {" y "}
                                <a
                                  href={privacyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80"
                                >
                                  {t("fields.acceptTerms.privacyLink") || "Política de Privacidad"}
                                </a>
                              </>
                            )}
                          </Label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

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
                      <AlertDescription className="text-sm">
                        {form.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-9 md:h-10 font-semibold bg-primary hover:bg-primary/90 text-sm md:text-base"
                    disabled={registerMutation.isPending}
                    StartIcon={registerMutation.isPending ? InlineLoader : undefined}
                  >
                    {registerMutation.isPending ? (
                      tCommon("loading") || "Cargando..."
                    ) : (
                      t("submit") || "Registrarse"
                    )}
                  </Button>
                </form>
              </Form>

              {heroAssets?.text?.link && (
                <Button variant="link" href={heroAssets.text.link} StartIcon={Sparkles} EndIcon={Sparkles} className="hidden md:flex text-xs md:text-sm mt-2">
                  Conoce más {heroAssets.text.link}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <RegistrationSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        poolName={poolName}
        poolSlug={poolSlug}
      />

      {/* Custom animations */}
      <style jsx>{`
        @keyframes grid {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(20px);
          }
        }
        
        @keyframes scan {
          0% {
            top: -10%;
          }
          50% {
            top: 110%;
          }
          100% {
            top: -10%;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
