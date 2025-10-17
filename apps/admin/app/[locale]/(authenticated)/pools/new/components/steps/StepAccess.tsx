"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, Key, Globe, Info } from "lucide-react";
import { Input, Label, Switch, FormField, RadioGroup, RadioGroupItem, Alert, AlertTitle, AlertDescription } from "@qp/ui";

const accessSchema = z.object({
  accessType: z.enum(["PUBLIC", "CODE", "EMAIL_INVITE"]),
  requireCaptcha: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  emailDomains: z.string().optional(), // Comma-separated
  maxUsers: z.number().int().min(1).optional(),
  startAt: z.string().optional(), // datetime-local
  endAt: z.string().optional()
});

type AccessFormData = z.infer<typeof accessSchema>;

interface StepAccessProps {
  onSubmit: (data: AccessFormData) => void;
  initialData?: Partial<AccessFormData>;
}

export function StepAccess({ onSubmit, initialData }: StepAccessProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<AccessFormData>({
    resolver: zodResolver(accessSchema),
    mode: "onChange",
    defaultValues: initialData || {
      accessType: "PUBLIC",
      requireCaptcha: false,
      requireEmailVerification: false
    }
  });

  const accessType = watch("accessType");
  const requireCaptcha = watch("requireCaptcha");
  const requireEmailVerification = watch("requireEmailVerification");
  const emailDomains = watch("emailDomains");
  const maxUsers = watch("maxUsers");
  const startAt = watch("startAt");
  const endAt = watch("endAt");

  const handleFormSubmit = (data: AccessFormData) => {
    onSubmit(data);
  };

  // Update wizard data in real-time
  useEffect(() => {
    if (isValid && accessType) {
      handleFormSubmit({
        accessType,
        requireCaptcha,
        requireEmailVerification,
        emailDomains,
        maxUsers,
        startAt,
        endAt
      });
    }
  }, [accessType, requireCaptcha, requireEmailVerification, emailDomains, maxUsers, startAt, endAt, isValid, onSubmit]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} id="wizard-step-5" className="flex flex-col gap-6">
      {/* Access Type */}
      <FormField label="Tipo de acceso" required>
        <RadioGroup value={accessType} onValueChange={(val) => setValue("accessType", val as any)}>
          <div className="grid gap-3">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                accessType === "PUBLIC" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="PUBLIC" id="access-public" className="mt-1" />
              <Label htmlFor="access-public" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Globe className="h-4 w-4" />
                  Público
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cualquiera puede registrarse sin restricciones
                </p>
              </Label>
            </div>

            <div
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                accessType === "CODE" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="CODE" id="access-code" className="mt-1" />
              <Label htmlFor="access-code" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Key className="h-4 w-4" />
                  Código de invitación
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Los usuarios necesitan un código para registrarse
                </p>
              </Label>
            </div>

            <div
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                accessType === "EMAIL_INVITE" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value="EMAIL_INVITE" id="access-email" className="mt-1" />
              <Label htmlFor="access-email" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4" />
                  Invitación por email
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Solo usuarios invitados por email pueden registrarse
                </p>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </FormField>

      {/* Helper Messages for CODE and EMAIL_INVITE */}
      {accessType === "CODE" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Códigos de Invitación</AlertTitle>
          <AlertDescription>
            Podrás crear y gestionar lotes de códigos después de crear la quiniela.
            Los códigos permiten controlar quién puede registrarse mediante códigos únicos.
          </AlertDescription>
        </Alert>
      )}

      {accessType === "EMAIL_INVITE" && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertTitle>Invitaciones por Email</AlertTitle>
          <AlertDescription>
            Podrás crear y enviar invitaciones por email después de crear la quiniela.
            Cada invitación incluirá un enlace único para registrarse.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Options */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        <h3 className="font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Opciones de seguridad
        </h3>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex-1">
            <Label htmlFor="requireCaptcha">Requerir CAPTCHA</Label>
            <p className="text-sm text-muted-foreground">
              Protege contra registros automatizados
            </p>
          </div>
          <Switch
            id="requireCaptcha"
            checked={requireCaptcha}
            onCheckedChange={(checked) => setValue("requireCaptcha", checked)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex-1">
            <Label htmlFor="requireEmailVerification">Verificar email</Label>
            <p className="text-sm text-muted-foreground">
              Los usuarios deben verificar su correo electrónico
            </p>
          </div>
          <Switch
            id="requireEmailVerification"
            checked={requireEmailVerification}
            onCheckedChange={(checked) => setValue("requireEmailVerification", checked)}
          />
        </div>
      </div>

      {/* Advanced Options */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        <h3 className="font-semibold">Opciones avanzadas (opcional)</h3>

        <FormField
          label="Dominios de email permitidos"
          htmlFor="emailDomains"
          description="Separados por comas (ej: empresa.com, partner.com)"
        >
          <Input
            id="emailDomains"
            placeholder="empresa.com, partner.com"
            {...register("emailDomains")}
          />
        </FormField>

        <FormField label="Límite de usuarios" htmlFor="maxUsers" description="Número máximo de participantes">
          <Input
            id="maxUsers"
            type="number"
            min={1}
            placeholder="Sin límite"
            {...register("maxUsers", { valueAsNumber: true })}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Inicio de registro" htmlFor="startAt">
            <Input id="startAt" type="datetime-local" {...register("startAt")} />
          </FormField>

          <FormField label="Fin de registro" htmlFor="endAt">
            <Input id="endAt" type="datetime-local" {...register("endAt")} />
          </FormField>
        </div>
      </div>
    </form>
  );
}
