"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { AlertCircle, Mail, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { InlineLoader } from "@qp/ui";
import Image from "next/image";
import { useTheme } from "next-themes";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { useSession } from "next-auth/react";
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
import { RegistrationSuccessModal } from "../../../signin/_components/registration-success-modal";

// Función para crear schema dinámico según datos del usuario
const createEmailInviteValidationSchema = (userData?: {
  displayName?: string | null;
  phone?: string | null;
} | null) => {
  const hasDisplayName = !!userData?.displayName;
  const hasPhone = !!userData?.phone;

  return z.object({
    displayName: hasDisplayName
      ? z.string().optional()
      : z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
    phone: hasPhone
      ? z.string().optional().or(z.literal(""))
      : z.string().min(1, "El teléfono es requerido").regex(/^\+[1-9]\d{1,14}$/, "Formato inválido (ej: +525512345678)"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones"
    })
  });
};

type EmailInviteRegistrationFormData = {
  displayName?: string;
  phone?: string;
  acceptTerms: boolean;
};

interface EmailInviteRegistrationFormProps {
  poolId: string;
  poolName: string;
  poolDescription: string | null;
  poolSlug: string;
  userId: string;
  inviteToken: string;
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

export function EmailInviteRegistrationForm({
  poolId,
  poolName,
  poolDescription,
  poolSlug,
  userId,
  inviteToken,
  termsUrl,
  privacyUrl,
  brandName = "DataGol",
  brandLogo,
  heroAssets,
  brandColors
}: EmailInviteRegistrationFormProps) {
  const t = useTranslations("auth.registration");
  const tCommon = useTranslations("common");
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [userData, setUserData] = useState<{
    displayName?: string | null;
    phone?: string | null;
  } | null>(null);

  // Determinar si hay sesión activa
  const hasSession = status === "authenticated" && !!session?.user;

  // Consulta de datos del usuario - solo se ejecuta si hay sesión
  const { data: userDataFromQuery, isLoading: isLoadingUserData } = trpc.users.getById.useQuery(
    { id: session?.user?.id || "" },
    { enabled: hasSession && !!session?.user?.id }
  );

  // Get optimized media URLs
  const optimizedCardUrl = getOptimizedMediaUrl(heroAssets?.mainCard?.url);
  const optimizedLogoUrl = getOptimizedMediaUrl(brandLogo?.url);

  const form = useForm<EmailInviteRegistrationFormData>({
    resolver: zodResolver(createEmailInviteValidationSchema(hasSession ? userDataFromQuery : null)),
    defaultValues: {
      displayName: "",
      phone: "",
      acceptTerms: false
    }
  });

  // Effect to populate form with existing user data when session exists
  useEffect(() => {
    if (hasSession && userDataFromQuery) {
      const newUserData = {
        displayName: userDataFromQuery.name,
        phone: userDataFromQuery.phone
      };
      setUserData(newUserData);

      // Pre-fill form with existing data
      if (userDataFromQuery.name) {
        form.setValue("displayName", userDataFromQuery.name);
      }
      if (userDataFromQuery.phone) {
        form.setValue("phone", userDataFromQuery.phone);
      }

      // Check if user has all data complete
      const hasAllData = userDataFromQuery.name && userDataFromQuery.phone;
      if (hasAllData) {
        setShowInfoModal(true);
      }

      form.clearErrors();
    } else if (!hasSession) {
      // Clear user data if no session
      setUserData(null);
      setShowInfoModal(false);
    }
  }, [hasSession, userDataFromQuery, form]);

  // Validate token on mount
  const validateTokenQuery = trpc.registration.validateInviteToken.useQuery(
    {
      poolId,
      token: inviteToken
    },
    {
      retry: false
    }
  );

  // Handle validation result with useEffect
  useEffect(() => {
    if (validateTokenQuery.data) {
      setInvitationEmail(validateTokenQuery.data.invitation.email);
      setTokenExpired(false);
    }
    if (validateTokenQuery.error) {
      if (validateTokenQuery.error.message.includes("expired")) {
        setTokenExpired(true);
      }
    }
  }, [validateTokenQuery.data, validateTokenQuery.error]);

  const registerMutation = trpc.registration.registerWithEmailInvite.useMutation({
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

  const onSubmit = (data: EmailInviteRegistrationFormData) => {
    if (!invitationEmail) {
      form.setError("root", {
        message: t("errors.invalidToken")
      });
      return;
    }

    // Validación adicional para usuarios con datos parciales
    if (hasSession && userData) {
      const displayName = data.displayName || userData.displayName;
      const phone = data.phone || userData.phone;

      if (!displayName) {
        form.setError("displayName", {
          message: "El nombre es requerido"
        });
        return;
      }

      registerMutation.mutate({
        poolId,
        userId,
        inviteToken,
        displayName,
        phone: phone || undefined
      });
    } else {
      registerMutation.mutate({
        poolId,
        userId,
        inviteToken,
        displayName: data.displayName,
        phone: data.phone || undefined
      });
    }
  };

  // Handle resend invitation (would need backend endpoint)
  const handleResendInvitation = () => {
    // TODO: Implement resend invitation endpoint
    console.log("Resend invitation for:", invitationEmail);
  };

  if (validateTokenQuery.isLoading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <InlineLoader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("invite.validating")}</p>
        </div>
      </section>
    );
  }

  if (validateTokenQuery.isError) {
    return (
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <p>
                {tokenExpired
                  ? t("errors.inviteExpired")
                  : t("errors.inviteInvalid")}
              </p>
              {tokenExpired && invitationEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendInvitation}
                  StartIcon={RefreshCw}
                >
                  {t("invite.resend")}
                </Button>
              )}
            </AlertDescription>
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
          <div className="grid md:grid-cols-[45%,55%] rounded-2xl overflow-hidden shadow-2xl h-auto md:h-[85vh] md:min-h-[500px] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">

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
                    {heroAssets?.text?.paragraph || t("invite.defaultParagraph") || "Has sido invitado a participar en esta quiniela exclusiva. ¡Completa tu registro y demuestra tus conocimientos!"}
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
                  {poolDescription || "Completa tu registro con invitación"}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Registration Form */}
            <div className="p-4 md:p-6 pt-8 md:pt-6 flex flex-col backdrop-blur-xl bg-card/40 dark:bg-card/70 border-l border-card/30 dark:border-card/60 overflow-y-auto max-h-[calc(100vh-2rem)] md:max-h-[85vh] custom-scrollbar">
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
                <div className="text-[10px] h-auto md:text-xs font-bold text-secondary text-center -mt-3 md:-mt-6 mb-3 md:mb-6 line-clamp-2">
                  {heroAssets.text.slogan}
                </div>
              )}
              {heroAssets?.text?.description && (
                <div className="text-sm md:text-2xl font-bold text-foreground text-justify mb-2 md:mb-4 line-clamp-5 md:line-clamp-6">
                  {heroAssets.text.description}
                </div>
              )}
              
              <div className="mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-accent mb-1">
                  {t("invite.formTitle") || "Registro por Invitación"}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t("invite.description") || "Completa tu información para unirte"}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 md:space-y-1">

                  {/* Email Display (Read-only) */}
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-medium">{t("fields.email.label") || "Tu Email"}</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 h-9 md:h-10">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{invitationEmail}</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {t("invite.emailLocked") || "Este email está vinculado a tu invitación"}
                    </p>
                  </div>

                  {/* Show personal data fields */}
                  <>
                    {/* Display Name */}
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => {
                        const isDisabled = hasSession && !!userData?.displayName;
                        return (
                          <FormItem>
                            <FormLabel className="text-xs md:text-sm font-medium">
                              {t("fields.displayName.label") || "Nombre Completo"}
                              {!isDisabled && <span className="text-destructive ml-1">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("fields.displayName.placeholder") || "ej: Lindsey Wilson"}
                                className="h-9 md:h-10 text-sm"
                                disabled={isDisabled}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => {
                        const isDisabled = hasSession && !!userData?.phone;
                        const isRequired = !hasSession || !userData?.phone;
                        return (
                          <FormItem>
                            <FormLabel className="text-xs md:text-sm font-medium">
                              {t("fields.phone.label") || "Teléfono"}
                              {isRequired && <span className="text-destructive ml-1">*</span>}
                              {!isRequired && <span className="text-muted-foreground ml-1">(Opcional)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder={t("fields.phone.placeholder") || "+52 55 1234 5678"}
                                className="h-9 md:h-10 text-sm"
                                disabled={isDisabled}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                  </>

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
                    disabled={registerMutation.isPending || !form.watch("acceptTerms")}
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

      {/* Info Modal for users with complete data */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-background rounded-lg shadow-lg p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                ¡Excelente!
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Ya estabas registrado con todos tus datos. Acepta los términos y condiciones para poder registrar esta quiniela a tu cuenta.
              </p>
            </div>
            <Button
              onClick={() => setShowInfoModal(false)}
              className="w-full"
              variant="default"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      <RegistrationSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        poolName={poolName}
        poolSlug={poolSlug}
      />

      {/* Custom animations and scrollbar styles */}
      <style jsx global>{`
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

        /* Custom elegant scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.3) transparent;
        }
      `}</style>
    </>
  );
}
