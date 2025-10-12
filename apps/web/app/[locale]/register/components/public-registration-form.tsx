"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, Button, FormField, Input, toastError, toastSuccess } from "@qp/ui";

import { trpc } from "@web/trpc/react";

interface PublicRegistrationFormProps {
  poolId: string;
}

interface FormData {
  displayName: string;
  email: string;
  phone?: string;
}

export function PublicRegistrationForm({ poolId }: PublicRegistrationFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const registerMutation = trpc.registration.registerPublic.useMutation({
    onSuccess: (data) => {
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
      ...data
    });
  };

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
        <AlertDescription>
          Este pool tiene acceso público. Completa el formulario para unirte.
        </AlertDescription>
      </Alert>

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
        label="Correo electrónico"
        htmlFor="email"
        required
        error={errors.email?.message}
        description="Para notificaciones y recuperación de cuenta"
      >
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register("email", {
            required: "El email es requerido",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Email inválido"
            }
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
