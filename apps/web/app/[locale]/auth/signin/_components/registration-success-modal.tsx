"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trophy, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qp/ui/components/dialog";
import { Button } from "@qp/ui/components/button";

interface RegistrationSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  poolSlug: string;
  nextMatchDate?: Date;
}

export function RegistrationSuccessModal({
  open,
  onOpenChange,
  poolName,
  poolSlug,
  nextMatchDate
}: RegistrationSuccessModalProps) {
  const t = useTranslations("auth.registration");
  const router = useRouter();

  const handleGoToDashboard = () => {
    onOpenChange(false);
    router.push(`/pools/${poolSlug}/fixtures`);
  };

  const handleShare = (platform: "whatsapp" | "twitter") => {
    const shareText = t("share.text", { poolName });
    const shareUrl = `${window.location.origin}/${poolSlug}`;

    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        "_blank"
      );
    } else if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {t("success.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("success.message", { poolName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Next Steps */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 text-primary" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{t("success.nextSteps")}</p>
                <p className="text-sm text-muted-foreground">
                  {nextMatchDate
                    ? t("success.nextStepsWithDate", {
                        date: nextMatchDate.toLocaleDateString()
                      })
                    : t("success.nextStepsDefault")}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleGoToDashboard}
            className="w-full"
            size="lg"
          >
            {t("success.goToDashboard")}
          </Button>

          {/* Share Options */}
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              {t("success.sharePrompt")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="minimal"
                size="sm"
                className="flex-1"
                onClick={() => handleShare("whatsapp")}
                StartIcon={Share2}
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleShare("twitter")}
                StartIcon={Share2}
              >
                Twitter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
