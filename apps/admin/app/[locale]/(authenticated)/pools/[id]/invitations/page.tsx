"use client";

import { useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Mail, 
  Upload, 
  Send, 
  RefreshCw, 
  Copy, 
  Search,
  Plus
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Badge,
  Input,
  Label,
  Textarea,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";

export default function PoolInvitationsPage() {
  const params = useParams();
  const poolId = params.id as string;
  const t = useTranslations("invitations");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailsText, setEmailsText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [uploading, setUploading] = useState(false);

  // Fetch pool and access policy
  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: accessPolicy } = trpc.access.getByPoolId.useQuery(
    { poolId },
    { enabled: !!poolId }
  );

  // Fetch invitations and stats
  const { data: invitations, isLoading, refetch } = trpc.access.getEmailInvitations.useQuery(
    { accessPolicyId: accessPolicy?.id || "" },
    { enabled: !!accessPolicy?.id }
  );

  const { data: stats } = trpc.access.invitationStats.useQuery(
    { poolId, tenantId: pool?.tenantId || "" },
    { enabled: !!pool?.tenantId }
  );

  const utils = trpc.useUtils();

  // Mutations
  const uploadCsvMutation = trpc.access.uploadInvitationsCsv.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("messages.createSuccess", { count: data.created }));
      refetch();
      utils.access.invitationStats.invalidate({ poolId, tenantId: pool?.tenantId || "" });
      setShowCreateModal(false);
      setEmailsText("");
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const sendInvitationsMutation = trpc.access.sendInvitations.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("messages.sendSuccess", { count: data.sent }));
      refetch();
      setShowSendModal(false);
      setSelectedIds([]);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const resendMutation = trpc.access.resendEmailInvitation.useMutation({
    onSuccess: () => {
      toastSuccess(t("messages.resendSuccess"));
      refetch();
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  // Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n");
      const emails = lines
        .map((line) => line.trim())
        .filter((line) => line && line.includes("@"));

      if (emails.length === 0) {
        toastError(t("messages.noValidEmailsCsv"));
        return;
      }

      if (!accessPolicy?.id || !pool?.tenantId || !pool?.brandId) {
        toastError(t("messages.missingData"));
        return;
      }

      await uploadCsvMutation.mutateAsync({
        poolId,
        accessPolicyId: accessPolicy.id,
        tenantId: pool.tenantId,
        brandId: pool.brandId,
        emails
      });
    } catch (error: any) {
      toastError(error.message || t("messages.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateFromText = async () => {
    const lines = emailsText.split("\n");
    const emails = lines
      .map((line) => line.trim())
      .filter((line) => line && line.includes("@"));

    if (emails.length === 0) {
      toastError(t("messages.noValidEmails"));
      return;
    }

    if (!accessPolicy?.id || !pool?.tenantId || !pool?.brandId) {
      toastError(t("messages.missingData"));
      return;
    }

    await uploadCsvMutation.mutateAsync({
      poolId,
      accessPolicyId: accessPolicy.id,
      tenantId: pool.tenantId,
      brandId: pool.brandId,
      emails
    });
  };

  const handleSendSelected = async () => {
    if (!pool?.tenantId || !pool?.brandId) {
      toastError("Missing required data");
      return;
    }

    await sendInvitationsMutation.mutateAsync({
      poolId,
      tenantId: pool.tenantId,
      brandId: pool.brandId,
      invitationIds: selectedIds.length > 0 ? selectedIds : undefined
    });
  };

  const handleResend = async (invitationId: string) => {
    if (!pool?.brandId) {
      toastError(t("messages.missingBrandData"));
      return;
    }

    await resendMutation.mutateAsync({
      id: invitationId,
      brandId: pool.brandId
    });
  };

  const handleCopyLink = (token: string) => {
    if (!pool?.brand?.domains?.[0] || !pool?.slug) {
      toastError(t("messages.cannotGenerateLink"));
      return;
    }
    const domain = pool.brand.domains[0];
    const url = `https://${domain}/pools/${pool.slug}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    toastSuccess(t("messages.copySuccess"));
  };

  // Filter invitations
  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];
    
    return invitations.filter((inv) => {
      const matchesSearch = inv.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invitations, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "warning" | "success" | "error"> = {
      PENDING: "warning",
      SENT: "default",
      OPENED: "default",
      ACCEPTED: "success",
      EXPIRED: "error",
      BOUNCED: "error"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (!pool || !accessPolicy) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (accessPolicy.accessType !== "EMAIL_INVITE") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {t("wrongAccessType", { type: accessPolicy.accessType })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")} - {pool.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            StartIcon={Upload}
          >
            {uploading ? t("uploading") : t("uploadCsv")}
          </Button>
          <Button onClick={() => setShowCreateModal(true)} StartIcon={Plus}>
            {t("createInvitations")}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.total")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.sent")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.opened")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.opened}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({stats.openRate}%)
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.activated")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.accepted}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({stats.activationRate}%)
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.bounced")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.bounced}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {stats && stats.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{t("activationProgress")}</span>
              <span className="text-muted-foreground">{stats.activationRate}%</span>
            </div>
            <Progress value={stats.activationRate} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="ALL">{t("filters.all")}</option>
                <option value="PENDING">{t("filters.pending")}</option>
                <option value="SENT">{t("filters.sent")}</option>
                <option value="OPENED">{t("filters.opened")}</option>
                <option value="ACCEPTED">{t("filters.accepted")}</option>
                <option value="EXPIRED">{t("filters.expired")}</option>
                <option value="BOUNCED">{t("filters.bounced")}</option>
              </select>
              {selectedIds.length > 0 && (
                <Button onClick={() => setShowSendModal(true)} StartIcon={Send}>
                  {t("sendSelected")} ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tableTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">{t("loading")}</p>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t("noInvitations")}</p>
              <Button onClick={() => setShowCreateModal(true)} StartIcon={Plus}>
                {t("createFirst")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredInvitations.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredInvitations.map((inv) => inv.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>{t("table.email")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("table.sent")}</TableHead>
                    <TableHead>{t("table.opened")}</TableHead>
                    <TableHead>{t("table.activated")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, inv.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== inv.id));
                            }
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell>
                        {inv.sentCount > 0 ? (
                          <span className="text-sm">{inv.sentCount}x</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {inv.openedAt ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {inv.acceptedAt ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(inv.acceptedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {inv.status !== "ACCEPTED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(inv.id)}
                              disabled={resendMutation.isPending}
                              StartIcon={RefreshCw}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(inv.token)}
                            StartIcon={Copy}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invitations Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("modal.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("modal.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emails">{t("modal.emailsLabel")}</Label>
              <Textarea
                id="emails"
                placeholder={t("modal.emailsPlaceholder")}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {t("modal.validEmailsCount", { count: emailsText.split("\n").filter((line) => line.trim() && line.includes("@")).length })}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEmailsText("");
              }}
            >
              {t("messages.cancel")}
            </Button>
            <Button
              onClick={handleCreateFromText}
              disabled={uploadCsvMutation.isPending || !emailsText.trim()}
            >
              {uploadCsvMutation.isPending ? t("messages.creating") : t("createInvitations")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invitations Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("modal.sendTitle")}</DialogTitle>
            <DialogDescription>
              {selectedIds.length > 0
                ? t("modal.sendDescription", { count: selectedIds.length })
                : t("modal.sendAllDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t("modal.sendNote")}
              {selectedIds.length === 0 && " " + t("modal.sendNoteAll")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              {t("messages.cancel")}
            </Button>
            <Button
              onClick={handleSendSelected}
              disabled={sendInvitationsMutation.isPending}
            >
              {sendInvitationsMutation.isPending ? t("messages.sending") : t("modal.sendTitle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
