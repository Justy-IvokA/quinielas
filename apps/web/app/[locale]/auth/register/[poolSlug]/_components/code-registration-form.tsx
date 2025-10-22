"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Sparkles, Trophy } from "lucide-react";
import { InlineLoader } from "@qp/ui";
import Image from "next/image";
import { useTheme } from "next-themes";
import { getOptimizedMediaUrl } from "@qp/utils/client";
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
  FormDescription,
} from "@qp/ui/components/form";
import { Alert, AlertDescription } from "@qp/ui/components/alert";
import { trpc } from "@web/trpc";
import { RegistrationSuccessModal } from "../../../signin/_components/registration-success-modal";

// Función para crear schema dinámico según datos del usuario
const createCodeValidationSchema = (userData?: {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
} | null) => {
  const hasDisplayName = !!userData?.displayName;
  const hasEmail = !!userData?.email;
  const hasPhone = !!userData?.phone;

  return z.object({
    inviteCode: z
      .string()
      .min(8, "El código debe tener al menos 8 caracteres")
      .max(50, "El código debe tener máximo 50 caracteres")
      .regex(/^[A-Za-z0-9._-]+$/, "Código inválido"),
    displayName: hasDisplayName
      ? z.string().optional()
      : z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
    email: hasEmail
      ? z.string().optional()
      : z.string().email("Correo electrónico inválido"),
    phone: hasPhone
      ? z.string().optional().or(z.literal(""))
      : z.string().min(1, "El teléfono es requerido").regex(/^\+[1-9]\d{1,14}$/, "Formato inválido (ej: +525512345678)"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones"
    })
  });
};

type CodeRegistrationFormData = {
  inviteCode: string;
  displayName?: string;
  email?: string;
  phone?: string;
  acceptTerms: boolean;
};

interface CodeRegistrationFormProps {
  poolId: string;
  poolName: string;
  poolDescription: string | null;
  poolSlug: string;
  userId: string;
  termsUrl?: string;
  privacyUrl?: string;
  prefilledCode?: string;
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

export function CodeRegistrationForm({
  poolId,
  poolName,
  poolDescription,
  poolSlug,
  userId,
  termsUrl,
  privacyUrl,
  prefilledCode,
  brandName = "Quinielas",
  brandLogo,
  heroAssets,
  brandColors
}: CodeRegistrationFormProps) {
  const t = useTranslations("auth.registration");
  const tCommon = useTranslations("common");
  const { theme } = useTheme();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState<number | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [userData, setUserData] = useState<{
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null>(null);

  // Query to check if user has any previous registrations
  const { data: existingData, isLoading: isLoadingUserData } = trpc.registration.hasExistingData.useQuery(
    { userId },
    { enabled: !!userId }
  );

  // Get optimized media URLs
  const optimizedCardUrl = getOptimizedMediaUrl(heroAssets?.mainCard?.url);
  const optimizedLogoUrl = getOptimizedMediaUrl(brandLogo?.url);

  const form = useForm<CodeRegistrationFormData>({
    resolver: zodResolver(createCodeValidationSchema(existingData?.hasData ? existingData : null)),
    defaultValues: {
      inviteCode: prefilledCode || "",
      displayName: "",
      email: "",
      phone: "",
      acceptTerms: false
    }
  });

  // Effect to populate form with existing user data and show modal
  useEffect(() => {
    if (existingData?.hasData) {
      setHasSession(true);
      const newUserData = {
        displayName: existingData.displayName,
        email: existingData.email,
        phone: existingData.phone
      };
      setUserData(newUserData);

      // Pre-fill form with existing data
      if (existingData.displayName) {
        form.setValue("displayName", existingData.displayName);
      }
      if (existingData.email) {
        form.setValue("email", existingData.email);
      }
      if (existingData.phone) {
        form.setValue("phone", existingData.phone);
      }

      // Check if user has all data complete
      const hasAllData = existingData.displayName && existingData.email && existingData.phone;
      if (hasAllData && codeValidated) {
        setShowInfoModal(true);
      }

      form.clearErrors();
    } else {
      setHasSession(false);
      setUserData(null);
    }
  }, [existingData, form, codeValidated]);

  const [codeToValidate, setCodeToValidate] = useState<string | null>(null);

  const validateCodeQuery = trpc.registration.validateInviteCode.useQuery(
    {
      poolId,
      code: codeToValidate || ""
    },
    {
      enabled: !!codeToValidate && codeToValidate.length <= 50,
      retry: false
    }
  );

  // Handle validation result
  useEffect(() => {
    if (validateCodeQuery.data) {
      setCodeValidated(true);
      setUsesRemaining(validateCodeQuery.data.code.usesRemaining);
      form.clearErrors("inviteCode");
    }
    if (validateCodeQuery.error) {
      setCodeValidated(false);
      setUsesRemaining(null);
      form.setError("inviteCode", {
        message: validateCodeQuery.error.message
      });
    }
  }, [validateCodeQuery.data, validateCodeQuery.error, form]);

  const registerMutation = trpc.registration.registerWithCode.useMutation({
    onSuccess: () => {
      // Mark that user has data for future registrations
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

  const handleValidateCode = () => {
    const code = form.getValues("inviteCode");
    if (code.length >= 8 && code.length <= 50) {
      setCodeToValidate(code);
    }
  };

  const onSubmit = (data: CodeRegistrationFormData) => {
    if (!codeValidated) {
      form.setError("inviteCode", {
        message: t("errors.codeNotValidated")
      });
      return;
    }

    // Validación adicional para usuarios con datos parciales
    if (hasSession && userData) {
      const displayName = data.displayName || userData.displayName;
      const email = data.email || userData.email;
      const phone = data.phone || userData.phone;

      if (!displayName) {
        form.setError("displayName", {
          message: "El nombre es requerido"
        });
        return;
      }

      if (!email) {
        form.setError("email", {
          message: "El correo electrónico es requerido"
        });
        return;
      }

      registerMutation.mutate({
        poolId,
        userId,
        inviteCode: data.inviteCode,
        displayName,
        email,
        phone: phone || undefined
      });
    } else {
      registerMutation.mutate({
        poolId,
        userId,
        inviteCode: data.inviteCode,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone || undefined
      });
    }
  };

  return (
    <>
      {/* Full screen background with brand colors */}
      <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        
        {/* Registration Card */}
        <div className="relative w-full max-w-5xl">
          <div className="grid md:grid-cols-[45%,55%] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] md:h-[65vh] md:min-h-[500px] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">

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
                    {heroAssets?.text?.paragraph || t("code.defaultParagraph") || "Participa en esta quiniela exclusiva y demuestra tus conocimientos deportivos. ¡Grandes premios te esperan!"}
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
                  {poolDescription || "Ingresa tu código de acceso exclusivo"}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Registration Form */}
            <div className="p-4 md:p-6 pb-6 md:pb-8 flex flex-col backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-l border-white/20 dark:border-gray-700/50 overflow-y-auto max-h-[calc(100vh-2rem)] md:max-h-[65vh] custom-scrollbar">
              {optimizedLogoUrl && (
              <div className="flex items-center justify-center mb-3 md:mb-6">
                <Image
                  src={optimizedLogoUrl}
                  alt={poolName}
                  width={300}
                  height={300}
                  priority
                  className={`object-contain w-48 md:w-72 ${theme === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''}`}
                />
              </div>
              )}
              {heroAssets?.text?.slogan && (
                <div className="text-[10px] md:text-xs font-bold text-secondary text-center -mt-3 md:-mt-6 mb-3 md:mb-6 line-clamp-2">
                  {heroAssets.text.slogan}
                </div>
              )}
              {heroAssets?.text?.description && (
                <div className="text-sm md:text-base font-bold text-foreground text-justify mb-2 md:mb-4 line-clamp-5 md:line-clamp-6">
                  {heroAssets.text.description}
                </div>
              )}
              <div className="mb-2 md:mb-1">
                <h2 className="text-lg md:text-2xl font-bold text-accent mb-1">
                  {t("code.formTitle") || "Registro"}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t("code.description") || "Completa tu información para unirte"}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 md:space-y-4">

                  {/* Invite Code */}
                  <FormField
                    control={form.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel className="text-sm font-medium">{t("fields.inviteCode.label") || "Código de Invitación"}</FormLabel> */}
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="ABCDEFGH-123456789"
                              maxLength={50}
                              className="font-mono h-9 md:h-10 text-sm"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^A-Za-z0-9._-]/g, "");
                                field.onChange(value);
                                setCodeValidated(false);
                              }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant={codeValidated ? "default" : "outline"}
                            size="sm"
                            className="h-9 md:h-10 px-2 md:px-3 shrink-0 text-xs md:text-sm"
                            onClick={handleValidateCode}
                            disabled={
                              field.value.length > 50 || field.value.length < 8 ||
                              validateCodeQuery.isLoading ||
                              codeValidated
                            }
                            StartIcon={validateCodeQuery.isLoading ? InlineLoader : codeValidated ? CheckCircle2 : undefined}
                          >
                            {validateCodeQuery.isLoading ? "" : codeValidated ? "" : t("fields.inviteCode.validate") || "Validar"}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Code Validation Success */}
                  {codeValidated && usesRemaining !== null && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                        {t("code.validated", { remaining: usesRemaining }) || "✓ Código válido"}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show fields after code validation */}
                  {codeValidated && (
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

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => {
                          const isDisabled = hasSession && !!userData?.email;
                          return (
                            <FormItem>
                              <FormLabel className="text-xs md:text-sm font-medium">
                                {t("fields.email.label") || "Tu Email"}
                                {!isDisabled && <span className="text-destructive ml-1">*</span>}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder={t("fields.email.placeholder") || "example@email.com"}
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
                  {codeValidated && (
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
                  )}
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
                Ya estabas registrado con todos tus datos. Ingresa el código de invitación y acepta los términos para poder registrar esta quiniela a tu cuenta.
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
