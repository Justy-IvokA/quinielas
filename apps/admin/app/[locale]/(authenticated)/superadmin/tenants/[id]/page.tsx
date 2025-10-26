"use client";

import { use, useState } from "react";
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
  SelectValue,
  SportsLoader
} from "@qp/ui";
import { ArrowLeftIcon, TrashIcon, UserPlusIcon, Building2Icon, Globe, Settings, PlusIcon } from "lucide-react";

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  
  // Unwrap params Promise (Next.js 15)
  const { id } = use(params);

  const { data: tenant, isLoading, refetch } = trpc.tenant.getById.useQuery({
    id
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

  const { data: featureOverrides, refetch: refetchOverrides } = trpc.tenant.listFeatureOverrides.useQuery({
    tenantId: id
  });

  const createOverrideMutation = trpc.tenant.createFeatureOverride.useMutation({
    onSuccess: () => {
      toast.success("Override de feature creado exitosamente");
      setIsAddOverrideOpen(false);
      refetchOverrides();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear override");
    }
  });

  const updateOverrideMutation = trpc.tenant.updateFeatureOverride.useMutation({
    onSuccess: () => {
      toast.success("Override actualizado exitosamente");
      refetchOverrides();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar override");
    }
  });

  const deleteOverrideMutation = trpc.tenant.deleteFeatureOverride.useMutation({
    onSuccess: () => {
      toast.success("Override eliminado exitosamente");
      refetchOverrides();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar override");
    }
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      licenseTier: formData.get("licenseTier") as any
    });
  };

  const handleAddOverride = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createOverrideMutation.mutate({
      tenantId: id,
      feature: formData.get("feature") as any,
      isEnabled: formData.get("isEnabled") === "true",
      expiresAt: formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : undefined
    });
  };

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addMemberMutation.mutate({
      tenantId: id,
      userEmail: formData.get("email") as string,
      role: formData.get("role") as any
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <SportsLoader size="lg" text="Cargando tenant..." />
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
        StartIcon={ArrowLeftIcon}
      >
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

                  <div className="grid gap-2">
                    <Label htmlFor="licenseTier">Tier de Licencia</Label>
                    <Select name="licenseTier" defaultValue={tenant.licenseTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOLAZO">Golazo</SelectItem>
                        <SelectItem value="GRAN_JUGADA">Gran Jugada</SelectItem>
                        <SelectItem value="COPA_DEL_MUNDO">La Copa del Mundo</SelectItem>
                      </SelectContent>
                    </Select>
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
              <Button variant="destructive" StartIcon={TrashIcon}>
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
                  onClick={() => deleteMutation.mutate({ id })}
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
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {brand.slug}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {brand.domains.length > 0
                          ? `${brand.domains.length} dominio(s): ${brand.domains.slice(0, 2).join(", ")}${brand.domains.length > 2 ? "..." : ""}`
                          : "Sin dominios configurados"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/superadmin/tenants/${id}/brands/${brand.id}/domains`)}
                    StartIcon={Settings}
                  >
                    Configurar Dominios
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Usuarios con acceso a este tenant</CardDescription>
          </div>

          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="sm" StartIcon={UserPlusIcon}>
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
                            tenantId: id,
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
                            tenantId: id,
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Feature Overrides</CardTitle>
            <CardDescription>Overrides específicos de features para este tenant</CardDescription>
          </div>

          <Dialog open={isAddOverrideOpen} onOpenChange={setIsAddOverrideOpen}>
            <DialogTrigger asChild>
              <Button size="sm" StartIcon={PlusIcon}>
                Agregar Override
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddOverride}>
                <DialogHeader>
                  <DialogTitle>Agregar Feature Override</DialogTitle>
                  <DialogDescription>
                    Crea un override para habilitar o deshabilitar una feature específica
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="feature">Feature</Label>
                    <Select name="feature" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una feature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIVIA">Trivia</SelectItem>
                        <SelectItem value="REWARDS_CHALLENGES">Rewards & Challenges</SelectItem>
                        <SelectItem value="NOTIFICATIONS_INTERMEDIATE">Notificaciones Intermedias</SelectItem>
                        <SelectItem value="NOTIFICATIONS_ADVANCED">Notificaciones Avanzadas</SelectItem>
                        <SelectItem value="ANALYTICS_ADVANCED">Analytics Avanzado</SelectItem>
                        <SelectItem value="PUSH_NOTIFICATIONS">Push Notifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="isEnabled">Estado</Label>
                    <Select name="isEnabled" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Habilitado</SelectItem>
                        <SelectItem value="false">Deshabilitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expiresAt">Expira en (opcional)</Label>
                    <Input
                      id="expiresAt"
                      name="expiresAt"
                      type="datetime-local"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOverrideOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createOverrideMutation.isPending}>
                    {createOverrideMutation.isPending ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!featureOverrides || featureOverrides.length === 0 ? (
            <p className="text-muted-foreground">No hay overrides configurados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureOverrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell className="font-medium">
                      {override.feature.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <span className={override.isEnabled ? "text-green-600" : "text-red-600"}>
                        {override.isEnabled ? "Habilitado" : "Deshabilitado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {override.expiresAt ? new Date(override.expiresAt).toLocaleDateString() : "Nunca"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(override.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateOverrideMutation.mutate({
                              id: override.id,
                              isEnabled: !override.isEnabled
                            })
                          }
                        >
                          {override.isEnabled ? "Deshabilitar" : "Habilitar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteOverrideMutation.mutate({ id: override.id })
                          }
                        >
                          Eliminar
                        </Button>
                      </div>
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
