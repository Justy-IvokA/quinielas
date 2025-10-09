"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CheckCircle2, Key } from "lucide-react";

import { Alert, AlertDescription, Badge, Button, FormField, Input, toastError, toastSuccess } from "@qp/ui";

import { trpc } from "@web/trpc/react";

interface CodeRegistrationFormProps {
  poolId: string;
  initialCode?: string | null;
}

interface FormData {
  inviteCode: string;
  displayName: string;
  email: string;
  phone?: string;
}

export function CodeRegistrationForm({ poolId, initialCode }: CodeRegistrationFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [validatedCode, setValidatedCode] = useState<string | null>(initialCode || null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      inviteCode: initialCode || ""
    }
  });

  const inviteCode = watch("inviteCode");

  const validateCodeQuery = trpc.registration.validateInviteCode.useQuery(
    { poolId, code: inviteCode },
    {
      enabled: inviteCode.length === 8 && !validatedCode,
      retry: false
    }
  );

  useEffect(() => {
    if (
      validateCodeQuery.status === "success" &&
      validateCodeQuery.data?.valid &&
      inviteCode.length === 8 &&
      validatedCode !== inviteCode
    ) {
      setValidatedCode(inviteCode);
      toastSuccess("Código válido");
    }
  }, [
    inviteCode,
    validatedCode,
    validateCodeQuery.data,
    validateCodeQuery.dataUpdatedAt,
    validateCodeQuery.status
  ]);

  useEffect(() => {
    if (
      validateCodeQuery.status === "error" &&
      validateCodeQuery.error &&
      inviteCode.length === 8
    ) {
      setValidatedCode(null);
      toastError(validateCodeQuery.error.message);
    }
  }, [
    inviteCode,
    validateCodeQuery.error,
    validateCodeQuery.errorUpdatedAt,
    validateCodeQuery.status
  ]);

  useEffect(() => {
    if (validatedCode && inviteCode !== validatedCode) {
      setValidatedCode(null);
    }
  }, [inviteCode, validatedCode]);

  const registerMutation = trpc.registration.registerWithCode.useMutation({
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
    if (!validatedCode) {
      toastError("Por favor, valida tu código de invitación primero");
      return;
    }

    // Mock user ID - replace with actual auth context
    const userId = "demo-user-id";

    await registerMutation.mutateAsync({
      poolId,
      userId,
      inviteCode: data.inviteCode,
      displayName: data.displayName,
      email: data.email
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
        <Key className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Este pool requiere un código de invitación para registrarse.
        </AlertDescription>
      </Alert>

      <FormField
        label="Código de invitación"
        htmlFor="inviteCode"
        required
        error={errors.inviteCode?.message}
        description="8 caracteres alfanuméricos (ej: ABC12345)"
      >
        <div className="flex gap-2">
          <Input
            id="inviteCode"
            placeholder="ABC12345"
            maxLength={8}
            className="font-mono uppercase"
            {...register("inviteCode", {
              required: "El código es requerido",
              pattern: {
                value: /^[A-Z0-9]{8}$/,
                message: "Código inválido (8 caracteres A-Z, 0-9)"
              }
            })}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          {validatedCode && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Válido
            </Badge>
          )}
        </div>
      </FormField>

      {validatedCode && (
        <>
          <FormField
            label="Nombre para mostrar"
            htmlFor="displayName"
            required
            error={errors.displayName?.message}
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
        </>
      )}
    </form>
  );
}
