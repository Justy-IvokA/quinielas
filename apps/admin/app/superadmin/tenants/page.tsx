"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import {
  Button,
  Input,
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
  Label,
  Textarea
} from "@qp/ui";
import { PlusIcon, SearchIcon, Building2Icon } from "lucide-react";

export default function TenantsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.tenant.list.useQuery({
    page,
    limit: 20,
    search: search || undefined
  });

  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("Tenant creado exitosamente");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear tenant");
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      defaultBrand: {
        name: formData.get("brandName") as string,
        slug: formData.get("brandSlug") as string,
        description: formData.get("brandDescription") as string || undefined
      }
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Administra todos los tenants del sistema
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Crear Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Tenant</DialogTitle>
                <DialogDescription>
                  Crea un nuevo tenant con su marca predeterminada
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Tenant *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Mi Empresa"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="mi-empresa"
                    pattern="[a-z0-9-]+"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo minúsculas, números y guiones
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descripción del tenant"
                  />
                </div>

                <div className="border-t pt-4 mt-2">
                  <h3 className="font-semibold mb-3">Marca Predeterminada</h3>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brandName">Nombre de la Marca *</Label>
                      <Input
                        id="brandName"
                        name="brandName"
                        placeholder="Marca Principal"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="brandSlug">Slug de la Marca *</Label>
                      <Input
                        id="brandSlug"
                        name="brandSlug"
                        placeholder="default"
                        pattern="[a-z0-9-]+"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="brandDescription">Descripción</Label>
                      <Textarea
                        id="brandDescription"
                        name="brandDescription"
                        placeholder="Descripción de la marca"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creando..." : "Crear Tenant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Marcas</TableHead>
                  <TableHead className="text-center">Pools</TableHead>
                  <TableHead className="text-center">Miembros</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2Icon className="h-4 w-4 text-muted-foreground" />
                        {tenant.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {tenant.slug}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant._count.brands}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant._count.pools}
                    </TableCell>
                    <TableCell className="text-center">
                      {tenant._count.members}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/superadmin/tenants/${tenant.id}`);
                        }}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Página {data.pagination.page} de {data.pagination.totalPages} (
                {data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
