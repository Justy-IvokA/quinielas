"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@qp/ui";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
}

export function BackButton({ fallbackHref, label }: BackButtonProps) {
  const router = useRouter();
  const t = useTranslations("common");

  const handleBack = () => {
    // Try to go back in history, fallback to href if provided
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      StartIcon={ArrowLeft}
      className="hover:bg-accent"
    >
      {label || t("back")}
    </Button>
  );
}
