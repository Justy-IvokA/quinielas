"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Textarea,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";
import { parseAndValidateEmails } from "@admin/lib/csv-utils";

interface CreateInvitationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  accessPolicyId: string;
  tenantId: string;
  brandId: string;
  onSuccess: () => void;
}

export function CreateInvitationsModal({
  open,
  onOpenChange,
  poolId,
  accessPolicyId,
  tenantId,
  brandId,
  onSuccess
}: CreateInvitationsModalProps) {
  const t = useTranslations("invitations.modal");
  const [emailsText, setEmailsText] = useState("");
  const [showInvalid, setShowInvalid] = useState(false);

  const uploadCsvMutation = trpc.access.uploadInvitationsCsv.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("createSuccess", { count: data.created }));
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const handleClose = () => {
    setEmailsText("");
    setShowInvalid(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const { valid, invalid } = parseAndValidateEmails(emailsText);

    if (valid.length === 0) {
      toastError(t("noValidEmails"));
      setShowInvalid(true);
      return;
    }

    if (invalid.length > 0) {
      setShowInvalid(true);
    }

    await uploadCsvMutation.mutateAsync({
      poolId,
      accessPolicyId,
      tenantId,
      brandId,
      emails: valid
    });
  };

  const { valid, invalid } = parseAndValidateEmails(emailsText);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="emails">{t("emailsLabel")}</Label>
            <Textarea
              id="emails"
              placeholder={t("emailsPlaceholder")}
              value={emailsText}
              onChange={(e) => {
                setEmailsText(e.target.value);
                setShowInvalid(false);
              }}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                {t("validEmailsCount", { count: valid.length })}
              </p>
              {invalid.length > 0 && showInvalid && (
                <p className="text-sm text-destructive">
                  {invalid.length} email(s) inválido(s)
                </p>
              )}
            </div>
          </div>

          {invalid.length > 0 && showInvalid && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive mb-1">
                Emails inválidos:
              </p>
              <ul className="text-xs text-destructive space-y-1">
                {invalid.slice(0, 5).map((email, i) => (
                  <li key={i} className="font-mono">• {email}</li>
                ))}
                {invalid.length > 5 && (
                  <li className="text-muted-foreground">
                    ... y {invalid.length - 5} más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadCsvMutation.isPending || valid.length === 0}
          >
            {uploadCsvMutation.isPending ? "Creando..." : `Crear ${valid.length} Invitaciones`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
