"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function PoolInvitationsPage() {
  const params = useParams();
  const poolId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [invitations, setInvitations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // TODO: Fetch invitations and stats using tRPC
  // const { data: invitationsData } = trpc.access.getEmailInvitations.useQuery({ accessPolicyId });
  // const { data: statsData } = trpc.access.invitationStats.useQuery({ poolId, tenantId });

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
        toast.error("No valid emails found in CSV");
        return;
      }

      // TODO: Call tRPC mutation
      // await uploadCsv.mutateAsync({ poolId, accessPolicyId, tenantId, emails });
      toast.success(`Uploaded ${emails.length} invitations`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendAll = async () => {
    if (!confirm("Send all pending invitations?")) return;

    try {
      // TODO: Call tRPC mutation
      // await sendInvitations.mutateAsync({ poolId, tenantId });
      toast.success("Invitations sent successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      // TODO: Call tRPC mutation
      // await resendInvitation.mutateAsync({ id: invitationId });
      toast.success("Invitation resent");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Manage email invitations for this pool
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
          <button
            onClick={handleSendAll}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Send All Pending
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Sent</p>
            <p className="text-2xl font-bold">{stats.sent}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Opened</p>
            <p className="text-2xl font-bold">
              {stats.opened}{" "}
              <span className="text-sm text-muted-foreground">
                ({stats.openRate}%)
              </span>
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Activated</p>
            <p className="text-2xl font-bold">
              {stats.accepted}{" "}
              <span className="text-sm text-muted-foreground">
                ({stats.activationRate}%)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {stats && stats.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Activation Progress</span>
            <span>{stats.activationRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${stats.activationRate}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading invitations...</p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No invitations yet</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Upload CSV
          </button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sent</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Opened</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{inv.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        inv.status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : inv.status === "EXPIRED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.sentCount > 0 ? `${inv.sentCount}x` : "Not sent"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.openedAt ? "✓" : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.status === "PENDING" && (
                      <button
                        onClick={() => handleResend(inv.id)}
                        className="text-primary hover:underline"
                      >
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
