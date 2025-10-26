"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SportsLoader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@qp/ui";
import { PlusIcon, SearchIcon, FileTextIcon, CheckCircle2, Archive, FileEdit, UserPlus, Pencil, Trash2 } from "lucide-react";

export default function TemplatesPage() {
  const t = useTranslations('superadmin.templates');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  const { data, isLoading, refetch } = trpc.superadmin.templates.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "DRAFT" | "PUBLISHED" | "ARCHIVED") : undefined
  });

  // Query tenants for assignment
  const { data: tenants } = trpc.superadmin.tenants.list.useQuery({
    page: 1,
    limit: 100
  });

  // Mutation to assign template to tenant
  const assignMutation = trpc.superadmin.templates.assignToTenant.useMutation({
    onSuccess: () => {
      toast.success("Plantilla asignada exitosamente");
      setAssignDialogOpen(false);
      setSelectedTemplate(null);
      setSelectedTenant("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al asignar plantilla");
    }
  });

  // Mutation to delete template
  const deleteMutation = trpc.superadmin.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Plantilla eliminada exitosamente");
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar plantilla");
    }
  });

  const handleAssignClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedTemplate || !selectedTenant) {
      toast.error("Selecciona un tenant");
      return;
    }

    assignMutation.mutate({
      templateId: selectedTemplate,
      tenantId: selectedTenant
    });
  };

  const handleDeleteClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!selectedTemplate) return;

    deleteMutation.mutate({
      id: selectedTemplate
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="success" className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />{t('status.PUBLISHED')}</Badge>;
      case "DRAFT":
        return <Badge variant="purple"><FileEdit className="mr-1 h-3 w-3" />{t('status.DRAFT')}</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline"><Archive className="mr-1 h-3 w-3" />{t('status.ARCHIVED')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-accent mt-1">
            {t('description')}
          </p>
        </div>

        <Button onClick={() => router.push("/superadmin/templates/new")} StartIcon={PlusIcon} className="text-foreground [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
          {t('createButton')}
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterAll')}</SelectItem>
            <SelectItem value="DRAFT">{t('status.DRAFT')}</SelectItem>
            <SelectItem value="PUBLISHED">{t('status.PUBLISHED')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('status.ARCHIVED')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SportsLoader size="md" text={t('loading')} />
        </div>
      ) : (
        <>
          <div className="border rounded-lg text-foreground">
            <Table>
              <TableHeader className="border-card/80 bg-card/70 p-4 shadow-sm backdrop-blur">
                <TableRow>
                  <TableHead className="text-secondary">{t('table.name')}</TableHead>
                  <TableHead className="text-secondary">{t('table.slug')}</TableHead>
                  <TableHead className="text-secondary">{t('table.status')}</TableHead>
                  <TableHead className="text-secondary">{t('table.sport')}</TableHead>
                  <TableHead className="text-secondary">{t('table.season')}</TableHead>
                  <TableHead className="text-center text-secondary">{t('table.assignments')}</TableHead>
                  <TableHead className="text-secondary">{t('table.created')}</TableHead>
                  <TableHead className="text-right text-secondary">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-card/50 bg-card/40 p-4 shadow-sm backdrop-blur">
                {data?.templates.map((template) => (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/superadmin/templates/${template.id}/edit`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                        {template.title}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {template.slug}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(template.status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {template.sport?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {template.seasonYear || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {template._count?.assignments || 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-500/20"
                          title="Editar plantilla"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/superadmin/templates/${template.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-amber-500/20"
                          title="Asignar a tenant"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignClick(template.id);
                          }}
                        >
                          <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-500/20"
                          title="Eliminar plantilla"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(template.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {t('pagination.page', { page: data.page, totalPages: data.totalPages, total: data.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t('pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog de Asignación */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Plantilla a Tenant</DialogTitle>
            <DialogDescription>
              Selecciona el tenant al que deseas asignar esta plantilla. El tenant podrá usar esta plantilla para crear quinielas.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Seleccionar Tenant
            </label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants?.tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedTemplate(null);
                setSelectedTenant("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={!selectedTenant || assignMutation.isPending}
              loading={assignMutation.isPending}
            >
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Eliminar Plantilla Permanentemente
            </DialogTitle>
            <DialogDescription>
              ⚠️ Esta acción no se puede deshacer. Se eliminará la plantilla de forma permanente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Alcances de la eliminación:</h4>
              <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                <li>La plantilla se eliminará de la base de datos</li>
                <li>No se podrá recuperar después de eliminar</li>
                <li>Si la plantilla está asignada a tenants, las asignaciones también se eliminarán</li>
                <li>Los pools creados a partir de esta plantilla NO serán afectados</li>
              </ul>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Solo se pueden eliminar plantillas en estado <strong>DRAFT</strong> sin asignaciones activas.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedTemplate(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
            >
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
