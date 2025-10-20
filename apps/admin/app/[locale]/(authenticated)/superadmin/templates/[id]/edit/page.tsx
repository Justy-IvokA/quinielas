"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SportsLoader
} from "@qp/ui";
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  CheckCircle2, 
  Archive, 
  Trash2, 
  Copy,
  Eye,
  Users
} from "lucide-react";

export default function EditTemplatePage() {
  const t = useTranslations('superadmin.templates.edit');
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: template, isLoading, refetch } = trpc.superadmin.templates.get.useQuery({
    id: templateId
  });

  const { data: previewData, isLoading: isPreviewLoading } = trpc.superadmin.templates.previewImport.useQuery(
    { id: templateId },
    { enabled: isPreviewOpen }
  );

  const updateMutation = trpc.superadmin.templates.update.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      refetch();
    },
    onError: (error) => {
      toast.error(t('updateError', { message: error.message }));
    }
  });

  const publishMutation = trpc.superadmin.templates.publish.useMutation({
    onSuccess: () => {
      toast.success(t('publish.success'));
      refetch();
    },
    onError: (error) => {
      toast.error(t('publish.error', { message: error.message }));
    }
  });

  const archiveMutation = trpc.superadmin.templates.archive.useMutation({
    onSuccess: () => {
      toast.success(t('archive.success'));
      refetch();
    },
    onError: (error) => {
      toast.error(t('archive.error', { message: error.message }));
    }
  });

  const deleteMutation = trpc.superadmin.templates.delete.useMutation({
    onSuccess: () => {
      toast.success(t('delete.success'));
      router.push("/superadmin/templates");
    },
    onError: (error) => {
      toast.error(t('delete.error', { message: error.message }));
    }
  });

  const cloneMutation = trpc.superadmin.templates.clone.useMutation({
    onSuccess: (data) => {
      toast.success(t('clone.success'));
      router.push(`/superadmin/templates/${data.id}/edit`);
    },
    onError: (error) => {
      toast.error(t('clone.error', { message: error.message }));
    }
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const rules = template?.rules as any;
    const accessDefaults = template?.accessDefaults as any;

    updateMutation.mutate({
      id: templateId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      competitionExternalId: (formData.get("competitionExternalId") as string) || undefined,
      seasonYear: parseInt(formData.get("seasonYear") as string) || undefined,
      stageLabel: (formData.get("stageLabel") as string) || undefined,
      roundLabel: (formData.get("roundLabel") as string) || undefined,
      rules: {
        exactScore: parseInt(formData.get("exactScore") as string) || rules?.exactScore || 5,
        correctSign: parseInt(formData.get("correctSign") as string) || rules?.correctSign || 3,
        goalDiffBonus: parseInt(formData.get("goalDiffBonus") as string) || rules?.goalDiffBonus || 1,
        tieBreakers: rules?.tieBreakers || ["EXACT_SCORES", "CORRECT_SIGNS"]
      },
      accessDefaults: {
        accessType: (formData.get("accessType") as any) || accessDefaults?.accessType || "PUBLIC",
        requireCaptcha: formData.get("requireCaptcha") === "on",
        requireEmailVerification: formData.get("requireEmailVerification") === "on"
      }
    });
  };

  const handleClone = () => {
    const newSlug = prompt(t('clone.prompt'), `${template?.slug}-copy`);
    if (newSlug) {
      cloneMutation.mutate({ id: templateId, newSlug });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <SportsLoader size="lg" text={t('loading')} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>{t('notFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const rules = template.rules as any;
  const accessDefaults = template.accessDefaults as any;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t('backButton')}
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{template.title}</h1>
              {template.status === "PUBLISHED" && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t('actions.publish')}
                </Badge>
              )}
              {template.status === "DRAFT" && (
                <Badge variant="purple">{t('../status.DRAFT')}</Badge>
              )}
              {template.status === "ARCHIVED" && (
                <Badge variant="outline">
                  <Archive className="mr-1 h-3 w-3" />
                  {t('../status.ARCHIVED')}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {template.assignments?.length || 0} tenant assignments
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  {t('actions.previewButton')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('preview.title')}</DialogTitle>
                  <DialogDescription>
                    {t('preview.description')}
                  </DialogDescription>
                </DialogHeader>
                {isPreviewLoading ? (
                  <div className="flex justify-center py-8">
                    <SportsLoader size="sm" text={t('preview.loading')} />
                  </div>
                ) : previewData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{t('preview.teams')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{previewData.teamsCount}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{t('preview.matches')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{previewData.matchesCount}</p>
                        </CardContent>
                      </Card>
                    </div>
                    {previewData.dateRange && (
                      <div>
                        <Label className="text-sm text-muted-foreground">{t('preview.dateRange')}</Label>
                        <p className="text-sm">
                          {new Date(previewData.dateRange.start).toLocaleDateString()} - {new Date(previewData.dateRange.end).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>{t('preview.noData')}</AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClone}
              disabled={cloneMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t('actions.cloneButton')}
            </Button>

            {template.status === "DRAFT" && (
              <Button
                size="sm"
                onClick={() => publishMutation.mutate({ id: templateId })}
                disabled={publishMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('actions.publishButton')}
              </Button>
            )}

            {template.status === "PUBLISHED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveMutation.mutate({ id: templateId })}
                disabled={archiveMutation.isPending}
              >
                <Archive className="mr-2 h-4 w-4" />
                {t('actions.archiveButton')}
              </Button>
            )}

            {template.status === "DRAFT" && template.assignments?.length === 0 && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('actions.deleteButton')}
                </Button>
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('delete.confirm', { name: template.title })}</DialogTitle>
                      <DialogDescription>
                        {t('delete.warning')}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                        {t('../create.form.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deleteMutation.mutate({ id: templateId });
                          setIsDeleteOpen(false);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        {t('actions.delete')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
            <TabsTrigger value="scope">{t('tabs.scope')}</TabsTrigger>
            <TabsTrigger value="rules">{t('tabs.rules')}</TabsTrigger>
            <TabsTrigger value="access">{t('tabs.access')}</TabsTrigger>
            <TabsTrigger value="assignments">
              <Users className="mr-2 h-4 w-4" />
              {t('tabs.assignments')} ({template.assignments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('basicInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">{t('title')} *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={template.title}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t('slug')}</Label>
                  <Input value={template.slug} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    {t('slugCannotBeChanged')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={template.description || ""}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scope" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('sportProviderScope')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="competitionExternalId">{t('competitionExternalId')}</Label>
                  <Input
                    id="competitionExternalId"
                    name="competitionExternalId"
                    defaultValue={template.competitionExternalId || ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="seasonYear">{t('seasonYear')}</Label>
                  <Input
                    id="seasonYear"
                    name="seasonYear"
                    type="number"
                    defaultValue={template.seasonYear || ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stageLabel">{t('stageLabel')}</Label>
                  <Input
                    id="stageLabel"
                    name="stageLabel"
                    defaultValue={template.stageLabel || ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="roundLabel">{t('roundLabel')}</Label>
                  <Input
                    id="roundLabel"
                    name="roundLabel"
                    defaultValue={template.roundLabel || ""}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('scoringRules')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="exactScore">{t('exactScore')}</Label>
                  <Input
                    id="exactScore"
                    name="exactScore"
                    type="number"
                    defaultValue={rules?.exactScore || 5}
                    min="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="correctSign">{t('correctSign')}</Label>
                  <Input
                    id="correctSign"
                    name="correctSign"
                    type="number"
                    defaultValue={rules?.correctSign || 3}
                    min="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="goalDiffBonus">{t('goalDiffBonus')}</Label>
                  <Input
                    id="goalDiffBonus"
                    name="goalDiffBonus"
                    type="number"
                    defaultValue={rules?.goalDiffBonus || 1}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('accessPolicyDefaults')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="accessType">{t('accessType')}</Label>
                  <Select name="accessType" defaultValue={accessDefaults?.accessType || "PUBLIC"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">{t('public')}</SelectItem>
                      <SelectItem value="CODE">{t('inviteCode')}</SelectItem>
                      <SelectItem value="EMAIL_INVITE">{t('emailInvitation')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireCaptcha"
                    name="requireCaptcha"
                    defaultChecked={accessDefaults?.requireCaptcha || false}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requireCaptcha" className="cursor-pointer">
                    {t('requireCaptcha')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    name="requireEmailVerification"
                    defaultChecked={accessDefaults?.requireEmailVerification || false}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requireEmailVerification" className="cursor-pointer">
                    {t('requireEmailVerification')}
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('tenantAssignments')}</CardTitle>
                <CardDescription>
                  {t('tenantsProvisionedWithThisTemplate')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.assignments && template.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {template.assignments.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{assignment.tenant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.tenant.slug}
                          </p>
                        </div>
                        <Badge variant={assignment.status === "DONE" ? "success" : assignment.status === "FAILED" ? "error" : "default"}>
                          {assignment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('noAssignmentsYet')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <SaveIcon className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? t('saving') : t('saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
