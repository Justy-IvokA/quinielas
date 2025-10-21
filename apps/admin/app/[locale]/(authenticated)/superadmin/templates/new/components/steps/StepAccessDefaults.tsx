"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Label, RadioGroup, RadioGroupItem, Checkbox } from "@qp/ui";
import { Info, Lock, Mail, Code, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";

interface StepAccessDefaultsProps {
  onSubmit: (data: {
    accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
    requireCaptcha: boolean;
    requireEmailVerification: boolean;
  }) => void;
  initialData?: {
    accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
    requireCaptcha: boolean;
    requireEmailVerification: boolean;
  };
}

export function StepAccessDefaults({ onSubmit, initialData }: StepAccessDefaultsProps) {
  const t = useTranslations("superadmin.templates.create.wizard.steps.access");
  
  const [formData, setFormData] = useState({
    accessType: (initialData?.accessType || "PUBLIC") as "PUBLIC" | "CODE" | "EMAIL_INVITE",
    requireCaptcha: initialData?.requireCaptcha ?? false,
    requireEmailVerification: initialData?.requireEmailVerification ?? false
  });

  useEffect(() => {
    onSubmit(formData);
  }, [formData]);

  const accessTypes = [
    {
      value: "PUBLIC" as const,
      icon: Globe,
      label: t("publicLabel"),
      description: t("publicDescription")
    },
    {
      value: "CODE" as const,
      icon: Code,
      label: t("codeLabel"),
      description: t("codeDescription")
    },
    {
      value: "EMAIL_INVITE" as const,
      icon: Mail,
      label: t("emailLabel"),
      description: t("emailDescription")
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("hint")}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{t("accessTypeTitle")}</h3>
        </div>

        <RadioGroup 
          value={formData.accessType} 
          onValueChange={(value: any) => setFormData({ ...formData, accessType: value })}
        >
          <div className="grid gap-3">
            {accessTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.accessType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={type.value} id={`access-${type.value}`} className="mt-1" />
                  <Label htmlFor={`access-${type.value}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t">
        <h3 className="font-semibold">{t("securityTitle")}</h3>

        <div className="flex items-start gap-3 p-4 rounded-lg border">
          <Checkbox
            id="requireCaptcha"
            checked={formData.requireCaptcha}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, requireCaptcha: checked as boolean })
            }
          />
          <Label htmlFor="requireCaptcha" className="flex-1 cursor-pointer">
            <div className="font-medium mb-1">{t("captchaLabel")}</div>
            <p className="text-sm text-muted-foreground">{t("captchaDescription")}</p>
          </Label>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg border">
          <Checkbox
            id="requireEmailVerification"
            checked={formData.requireEmailVerification}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, requireEmailVerification: checked as boolean })
            }
          />
          <Label htmlFor="requireEmailVerification" className="flex-1 cursor-pointer">
            <div className="font-medium mb-1">{t("emailVerificationLabel")}</div>
            <p className="text-sm text-muted-foreground">{t("emailVerificationDescription")}</p>
          </Label>
        </div>
      </div>
    </div>
  );
}
