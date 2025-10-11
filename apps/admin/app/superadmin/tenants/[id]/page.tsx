"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import { 
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@qp/ui";
import { ArrowLeftIcon, TrashIcon, UserPlusIcon, Building2Icon } from "lucide-react";

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { data: tenant, isLoading, refetch } = trpc.tenant.getById.useQuery({
    id: params.id
  });

  const updateMutation = trpc.tenant.update.useMutation({
    onSuccess: () => {
      toast.success("Tenant actualizado exitosamente");
      setIsEditOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar tenant");
    }
  });

  const deleteMutation = trpc.tenant.delete.useMutation({
    onSuccess: () => {
      toast.success("Tenant eliminado exitosamente");
      router.push("/superadmin/tenants");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar tenant");
    }
  });

  const addMemberMutation = trpc.tenant.addMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro agregado exitosamente");
      setIsAddMemberOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al agregar miembro");
    }
  });

  const removeMemberMutation = trpc.tenant.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro removido exitosamente");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al remover miembro");
    }
  });

  const setRoleMutation = trpc.tenant.setMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizado exitosamente");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar rol");
    }
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: params.id,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined
    });
  };

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addMemberMutation.mutate({
      tenantId: params.id,
      userEmail: formData.get("email") as string,
      role: formData.get("role") as any
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-8">
        <p>Tenant no encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/superadmin/tenants")}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Volver a Tenants
      </Button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2Icon className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-muted-foreground font-mono">{tenant.slug}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Editar</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleUpdate}>
                <DialogHeader>
                  <DialogTitle>Editar Tenant</DialogTitle>
                  <DialogDescription>
                    Actualiza la información del tenant
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={tenant.name}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={tenant.slug}
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={tenant.description || ""}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. El tenant solo se puede eliminar
                  si no tiene pools, registros o predicciones asociadas.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={(e) => e.preventDefault()}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: params.id })}
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Marcas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenant.brands.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenant._count.pools}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predicciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenant._count.predictions}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Marcas</CardTitle>
          <CardDescription>Marcas asociadas a este tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.brands.length === 0 ? (
            <p className="text-muted-foreground">No hay marcas configuradas</p>
          ) : (
            <div className="space-y-2">
              {tenant.brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {brand.slug}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {brand.domains.length > 0
                      ? brand.domains.join(", ")
                      : "Sin dominios"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Usuarios con acceso a este tenant</CardDescription>
          </div>

          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Agregar Miembro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddMember}>
                <DialogHeader>
                  <DialogTitle>Agregar Miembro</DialogTitle>
                  <DialogDescription>
                    Agrega un usuario al tenant. Si el email no existe, se creará automáticamente.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select name="role" defaultValue="PLAYER" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                        <SelectItem value="TENANT_ADMIN">TENANT_ADMIN</SelectItem>
                        <SelectItem value="TENANT_EDITOR">TENANT_EDITOR</SelectItem>
                        <SelectItem value="PLAYER">PLAYER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddMemberOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addMemberMutation.isPending}>
                    {addMemberMutation.isPending ? "Agregando..." : "Agregar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {tenant.members.length === 0 ? (
            <p className="text-muted-foreground">No hay miembros asignados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Agregado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.name || "Sin nombre"}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          setRoleMutation.mutate({
                            tenantId: params.id,
                            userId: member.user.id,
                            role: role as any
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                          <SelectItem value="TENANT_ADMIN">TENANT_ADMIN</SelectItem>
                          <SelectItem value="TENANT_EDITOR">TENANT_EDITOR</SelectItem>
                          <SelectItem value="PLAYER">PLAYER</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMemberMutation.mutate({
                            tenantId: params.id,
                            userId: member.user.id
                          })
                        }
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
