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
  SportsLoader
} from "@qp/ui";
import { PlusIcon, SearchIcon, FileTextIcon, CheckCircle2, Archive, FileEdit } from "lucide-react";

export default function TemplatesPage() {
  const t = useTranslations('superadmin.templates');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch } = trpc.superadmin.templates.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "DRAFT" | "PUBLISHED" | "ARCHIVED") : undefined
  });

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>

        <Button onClick={() => router.push("/superadmin/templates/new")} StartIcon={PlusIcon}>
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.slug')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.sport')}</TableHead>
                  <TableHead>{t('table.season')}</TableHead>
                  <TableHead className="text-center">{t('table.assignments')}</TableHead>
                  <TableHead>{t('table.created')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/superadmin/templates/${template.id}/edit`);
                        }}
                      >
                        {t('actions.edit')}
                      </Button>
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
    </div>
  );
}
