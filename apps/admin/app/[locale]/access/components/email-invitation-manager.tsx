"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Mail, Plus, RefreshCw } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toastSuccess,
  toastError
} from "@qp/ui";

import { trpc } from "@admin/trpc";

interface EmailInvitationManagerProps {
  accessPolicyId: string;
}

interface CreateInvitationForm {
  email: string;
}

export function EmailInvitationManager({ accessPolicyId }: EmailInvitationManagerProps) {
  const t = useTranslations("access.invites");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = trpc.useUtils();
  const poolId = "demo-pool-id"; // Replace with actual pool context
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context

  const { data: invitations, isLoading } = trpc.access.getEmailInvitations.useQuery({ accessPolicyId });

  const { register, handleSubmit, reset } = useForm<CreateInvitationForm>();

  const createInvitationMutation = trpc.access.createEmailInvitation.useMutation({
    onSuccess: () => {
      toastSuccess(t("createSuccess"));
      utils.access.getEmailInvitations.invalidate({ accessPolicyId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(t("createError", { message: error.message }));
    }
  });

  const resendMutation = trpc.access.resendEmailInvitation.useMutation({
    onSuccess: () => {
      toastSuccess(t("resendSuccess"));
      utils.access.getEmailInvitations.invalidate({ accessPolicyId });
    },
    onError: (error) => {
      toastError(t("resendError", { message: error.message }));
    }
  });

  const onSubmit = (data: CreateInvitationForm) => {
    createInvitationMutation.mutate({
      poolId,
      accessPolicyId,
      tenantId,
      ...data
    });
  };
  if (isLoading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("count", { count: invitations?.length || 0 })}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button StartIcon={Plus}>{t("createButton")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialog.title")}</DialogTitle>
              <DialogDescription>{t("dialog.description")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField label={t("form.email")}
                htmlFor="email"
                required
              >
                <Input
                  id="email"
                  type="email"
                  placeholder={t("form.placeholder")}
                  {...register("email", { required: true })}
                />
              </FormField>
              <Button type="submit" loading={createInvitationMutation.isPending} StartIcon={Mail}>
                {t("form.submit")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {invitations && invitations.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.email")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.sent")}</TableHead>
                  <TableHead>{t("table.expires")}</TableHead>
                  <TableHead className="w-[120px]">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitation.status === "PENDING"
                            ? "default"
                            : invitation.status === "ACCEPTED"
                              ? "success"
                              : "outline"
                        }
                      >
                        {t(`status.${invitation.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t("sentCount", { count: invitation.sentCount })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.expiresAt
                        ? new Date(invitation.expiresAt).toLocaleDateString()
                        : t("noExpiration")}
                    </TableCell>
                    <TableCell>
                      {invitation.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="minimal"
                          StartIcon={RefreshCw}
                          onClick={() => resendMutation.mutate({ id: invitation.id })}
                          loading={resendMutation.isPending}
                        >
                          {t("actions.resend")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
