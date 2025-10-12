"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@qp/ui";
import { Input } from "@qp/ui";
import { Label } from "@qp/ui";
import { Mail } from "lucide-react";

interface EmailFormProps {
  callbackUrl?: string;
  requireCaptcha: boolean;
  onCaptchaNeeded?: () => void;
}

export function EmailForm({ callbackUrl, requireCaptcha, onCaptchaNeeded }: EmailFormProps) {
  const t = useTranslations("auth.signin");
  const tErrors = useTranslations("auth.errors");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(tErrors("emailRequired"));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(tErrors("emailInvalid"));
      return;
    }

    if (requireCaptcha) {
      toast.error(tErrors("captchaRequired"));
      onCaptchaNeeded?.();
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: callbackUrl || "/",
      });

      if (result?.error) {
        toast.error(tErrors("signInFailed"));
      } else {
        setEmailSent(true);
        toast.success(t("emailSent", { email }));
      }
    } catch (error) {
      console.error("[email-form] Sign in error:", error);
      toast.error(tErrors("generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t("checkEmail")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("emailSentDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="w-full"
        >
          {t("backToSignin")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          required
          aria-required="true"
          aria-invalid={email && !validateEmail(email) ? "true" : "false"}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? t("sendingLink") : t("sendLink")}
      </Button>
    </form>
  );
}
