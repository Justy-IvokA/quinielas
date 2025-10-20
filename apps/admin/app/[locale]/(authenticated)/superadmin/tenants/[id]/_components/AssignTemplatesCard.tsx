"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Checkbox,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  InlineLoader
} from "@qp/ui";
import { PlusIcon, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AssignTemplatesCardProps {
  tenantId: string;
  assignments: any[];
  onRefetch: () => void;
}

export function AssignTemplatesCard({ tenantId, assignments, onRefetch }: AssignTemplatesCardProps) {
  const t = useTranslations('superadmin.tenants.detail.templates');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const { data: templatesData } = trpc.superadmin.templates.list.useQuery({
    status: "PUBLISHED",
    page: 1,
    limit: 100
  });

  const assignMutation = trpc.superadmin.tenants.assignTemplates.useMutation({
    onSuccess: (data) => {
      const successCount = data.results.filter(r => r.status === "DONE").length;
      const failCount = data.results.filter(r => r.status === "FAILED").length;
      
      if (failCount > 0) {
        toast.warning(`${successCount} templates assigned, ${failCount} failed`);
      } else {
        toast.success(t('assignSuccess', { count: successCount }));
      }
      
      setIsOpen(false);
      setSelectedTemplates([]);
      onRefetch();
    },
    onError: (error) => {
      toast.error(t('assignError', { message: error.message }));
    }
  });

  const handleAssign = () => {
    if (selectedTemplates.length === 0) {
      toast.error("Please select at least one template");
      return;
    }

    assignMutation.mutate({
      tenantId,
      templateIds: selectedTemplates
    });
  };

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "RUNNING":
        return <InlineLoader className="text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                {t('assignButton')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('assign.title')}</DialogTitle>
                <DialogDescription>
                  {t('assign.description')}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[400px] overflow-y-auto">
                {templatesData?.templates && templatesData.templates.length > 0 ? (
                  <div className="space-y-2">
                    {templatesData.templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleTemplate(template.id)}
                      >
                        <Checkbox
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={() => toggleTemplate(template.id)}
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer font-medium">
                            {template.title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {template.description || template.slug}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {template.sport && (
                              <Badge variant="outline" className="text-xs">
                                {template.sport.name}
                              </Badge>
                            )}
                            {template.seasonYear && (
                              <Badge variant="outline" className="text-xs">
                                {template.seasonYear}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('assign.noTemplates')}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedTemplates([]);
                  }}
                >
                  {t('assign.cancel')}
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={selectedTemplates.length === 0 || assignMutation.isPending}
                >
                  {t('assign.submit')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {assignments && assignments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.template')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.result')}</TableHead>
                <TableHead>{t('table.assigned')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.template.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.template.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <Badge
                        variant={
                          assignment.status === "DONE"
                            ? "success"
                            : assignment.status === "FAILED"
                            ? "error"
                            : "default"
                        }
                      >
                        {t(`status.${assignment.status}`)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.result && assignment.status === "DONE" ? (
                      <div className="text-sm">
                        <p>{t('result.pool', { slug: assignment.result.poolSlug })}</p>
                        <p className="text-muted-foreground">
                          {t('result.imported', { 
                            teams: assignment.result.imported?.teams || 0, 
                            matches: assignment.result.imported?.matches || 0 
                          })}
                        </p>
                      </div>
                    ) : assignment.result && assignment.status === "FAILED" ? (
                      <p className="text-sm text-red-500">
                        {t('result.error', { message: assignment.result.error || "Unknown error" })}
                      </p>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(assignment.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('empty')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
