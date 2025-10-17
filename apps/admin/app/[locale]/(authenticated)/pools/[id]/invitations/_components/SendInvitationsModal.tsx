"use client";

import { useTranslations } from "next-intl";
import { Send, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";

interface SendInvitationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  tenantId: string;
  brandId: string;
  selectedIds: string[];
  onSuccess: () => void;
}

export function SendInvitationsModal({
  open,
  onOpenChange,
  poolId,
  tenantId,
  brandId,
  selectedIds,
  onSuccess
}: SendInvitationsModalProps) {
  const t = useTranslations("invitations.modal");

  const sendInvitationsMutation = trpc.access.sendInvitations.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("sendSuccess", { count: data.sent }));
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const handleSend = async () => {
    await sendInvitationsMutation.mutateAsync({
      poolId,
      tenantId,
      brandId,
      invitationIds: selectedIds.length > 0 ? selectedIds : undefined
    });
  };

  const isSendingAll = selectedIds.length === 0;
  const count = selectedIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("sendTitle")}
          </DialogTitle>
          <DialogDescription>
            {isSendingAll
              ? t("sendAllDescription")
              : t("sendDescription", { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-muted-foreground">
                {t("sendNote")}
              </p>
              {isSendingAll && (
                <p className="text-muted-foreground mt-2">
                  {t("sendNoteAll")}
                </p>
              )}
            </div>
          </div>

          {!isSendingAll && (
            <div className="text-sm">
              <p className="font-medium">
                Se enviarán {count} invitación(es) seleccionada(s)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendInvitationsMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendInvitationsMutation.isPending}
          >
            {sendInvitationsMutation.isPending
              ? "Enviando..."
              : isSendingAll
              ? "Enviar Todas"
              : `Enviar ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
