"use client";

import { useState } from "react";
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

import { trpc } from "../../../src/trpc/react";

interface EmailInvitationManagerProps {
  accessPolicyId: string;
}

interface CreateInvitationForm {
  email: string;
}

export function EmailInvitationManager({ accessPolicyId }: EmailInvitationManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = trpc.useUtils();
  const poolId = "demo-pool-id"; // Replace with actual pool context
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context

  const { data: invitations, isLoading } = trpc.access.getEmailInvitations.useQuery({ accessPolicyId });

  const { register, handleSubmit, reset } = useForm<CreateInvitationForm>();

  const createInvitationMutation = trpc.access.createEmailInvitation.useMutation({
    onSuccess: () => {
      toastSuccess("Invitación creada exitosamente");
      utils.access.getEmailInvitations.invalidate({ accessPolicyId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(`Error al crear invitación: ${error.message}`);
    }
  });

  const resendMutation = trpc.access.resendEmailInvitation.useMutation({
    onSuccess: () => {
      toastSuccess("Invitación reenviada");
      utils.access.getEmailInvitations.invalidate({ accessPolicyId });
    },
    onError: (error) => {
      toastError(`Error al reenviar: ${error.message}`);
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
    return <div className="text-muted-foreground">Cargando invitaciones...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invitaciones por email</h3>
          <p className="text-sm text-muted-foreground">
            {invitations?.length || 0} invitación(es) enviada(s)
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button StartIcon={Plus}>Crear invitación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear invitación por email</DialogTitle>
              <DialogDescription>
                Envía una invitación personalizada a un correo electrónico.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField label="Correo electrónico" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  {...register("email", { required: true })}
                />
              </FormField>
              <Button type="submit" loading={createInvitationMutation.isPending} StartIcon={Mail}>
                Enviar invitación
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
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="w-[120px]">Acciones</TableHead>
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
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.sentCount} vez/veces
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.expiresAt
                        ? new Date(invitation.expiresAt).toLocaleDateString("es-MX")
                        : "Sin expiración"}
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
                          Reenviar
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
            <p className="text-muted-foreground">No hay invitaciones creadas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
