"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@qp/ui";
import { User, Phone } from "lucide-react";
import { trpc } from "@web/trpc/react";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+[1-9]\d{1,14}$/.test(val),
      "Formato inválido. Usa formato internacional: +525512345678"
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CompleteProfileFormProps {
  userId: string;
  email: string;
  callbackUrl: string;
}

export function CompleteProfileForm({ userId, email, callbackUrl }: CompleteProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("auth.completeProfile");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("success"));
      // Redirect to callback URL or dashboard
      router.push(callbackUrl);
      router.refresh(); // Refresh to update session
    },
    onError: (error) => {
      toast.error(`${t("error")}: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    await updateProfileMutation.mutateAsync({
      name: data.name,
      phone: data.phone || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email display (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          {t("emailVerified")}
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("nameLabel")} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder={t("namePlaceholder")}
            className="pl-10"
            {...register("name")}
            disabled={isSubmitting}
            autoFocus
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </div>
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("nameDescription")}
        </p>
      </div>

      {/* Phone input (optional) */}
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
            className="pl-10"
            {...register("phone")}
            disabled={isSubmitting}
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
        </div>
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("phoneDescription")}
        </p>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      {/* Privacy notice */}
      <p className="text-xs text-center text-muted-foreground">
        Al continuar, aceptas nuestros{" "}
        <a href="/terms" className="underline hover:text-primary">
          Términos de Servicio
        </a>{" "}
        y{" "}
        <a href="/privacy" className="underline hover:text-primary">
          Política de Privacidad
        </a>
      </p>
    </form>
  );
}
