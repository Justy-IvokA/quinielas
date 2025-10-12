"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2, Mail } from "lucide-react";

import { Alert, AlertDescription, Button, FormField, Input, Skeleton, toastError, toastSuccess } from "@qp/ui";

import { trpc } from "@web/trpc/react";

interface EmailInviteRegistrationFormProps {
  poolId: string;
  inviteToken: string;
}

interface FormData {
  displayName: string;
  email: string;
  phone?: string;
}

export function EmailInviteRegistrationForm({ poolId, inviteToken }: EmailInviteRegistrationFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const { data: validation, isLoading: isValidating, error: validationError } = trpc.registration.validateInviteToken.useQuery(
    { poolId, token: inviteToken },
    { retry: false }
  );

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (validation?.invitation.email) {
      setValue("email", validation.invitation.email);
    }
  }, [validation, setValue]);

  const registerMutation = trpc.registration.registerWithEmailInvite.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toastSuccess("¡Registro exitoso! Redirigiendo...");
      setTimeout(() => {
        router.push(`/pools/${poolId}/dashboard`);
      }, 2000);
    },
    onError: (error) => {
      toastError(`Error al registrarse: ${error.message}`);
    }
  });

  const onSubmit = async (data: FormData) => {
    // Mock user ID - replace with actual auth context
    const userId = "demo-user-id";

    await registerMutation.mutateAsync({
      poolId,
      userId,
      inviteToken,
      displayName: data.displayName,
      email: data.email
    });
  };

  if (isValidating) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-32" />
      </div>
    );
  }

  if (validationError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {validationError.message || "Token de invitación inválido o expirado"}
        </AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription className="ml-2">
          ¡Registro completado! Serás redirigido a tu dashboard...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Has sido invitado por correo electrónico. Completa tu registro para unirte.
        </AlertDescription>
      </Alert>

      <FormField
        label="Correo electrónico"
        htmlFor="email"
        required
        error={errors.email?.message}
        description="Este email debe coincidir con tu invitación"
      >
        <Input
          id="email"
          type="email"
          readOnly
          className="bg-muted"
          {...register("email", {
            required: "El email es requerido"
          })}
        />
      </FormField>

      <FormField
        label="Nombre para mostrar"
        htmlFor="displayName"
        required
        error={errors.displayName?.message}
        description="Así aparecerás en el leaderboard"
      >
        <Input
          id="displayName"
          placeholder="Juan Pérez"
          {...register("displayName", {
            required: "El nombre es requerido",
            minLength: { value: 2, message: "Mínimo 2 caracteres" },
            maxLength: { value: 50, message: "Máximo 50 caracteres" }
          })}
        />
      </FormField>

      <FormField
        label="Teléfono (opcional)"
        htmlFor="phone"
        error={errors.phone?.message}
        description="Para recibir recordatorios por WhatsApp/SMS"
      >
        <Input
          id="phone"
          type="tel"
          placeholder="+525512345678"
          {...register("phone", {
            pattern: {
              value: /^\+[1-9]\d{1,14}$/,
              message: "Formato inválido (ej: +525512345678)"
            }
          })}
        />
      </FormField>

      <Button type="submit" loading={registerMutation.isPending}>
        Completar registro
      </Button>
    </form>
  );
}
