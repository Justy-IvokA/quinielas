"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@qp/ui";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter();
  const t = useTranslations("common");

  const handleBack = () => {
    // Si existe fallbackHref, redirige. Si no, trata de regresar en el historial. En caso contrario, redirige a la página principal
    if (fallbackHref) {
      router.push(fallbackHref);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      StartIcon={ArrowLeft}
      className={`hidden md:flex hover:bg-accent [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)] ${className}`}
    >
      {label || t("back")}
    </Button>
  );
}
