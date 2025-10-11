"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function PoolCodesPage() {
  const params = useParams();
  const poolId = params.id as string;

  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // TODO: Fetch batches and stats using tRPC
  // const { data: batchesData } = trpc.access.getCodeBatches.useQuery({ accessPolicyId });
  // const { data: statsData } = trpc.access.codeStats.useQuery({ poolId, tenantId });

  const handleCreateBatch = async (data: any) => {
    try {
      // TODO: Call tRPC mutation
      // await createBatch.mutateAsync({ accessPolicyId, tenantId, ...data });
      toast.success("Code batch created successfully");
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create batch");
    }
  };

  const handleDownloadCsv = async (batchId: string) => {
    try {
      // TODO: Call tRPC query and download CSV
      // const data = await downloadCodes.queryAsync({ batchId, tenantId });
      toast.success("CSV downloaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to download CSV");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invite Codes</h1>
          <p className="text-muted-foreground mt-1">
            Manage code batches and track redemptions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create Batch
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Codes</p>
            <p className="text-2xl font-bold">{stats.totalCodes}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Unused</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {stats.unused}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Used</p>
            <p className="text-2xl font-bold text-green-600">{stats.used}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Redemptions</p>
            <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Redemption Rate</p>
            <p className="text-2xl font-bold">{stats.redemptionRate}%</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No code batches yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create First Batch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {batch.name || "Unnamed Batch"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        batch.status === "UNUSED"
                          ? "bg-gray-100 text-gray-800"
                          : batch.status === "USED"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                  {batch.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {batch.description}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Codes</p>
                      <p className="font-semibold">{batch.totalCodes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Used</p>
                      <p className="font-semibold">{batch.usedCodes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uses Per Code</p>
                      <p className="font-semibold">{batch.maxUsesPerCode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {batch.prefix && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Prefix:</span> {batch.prefix}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDownloadCsv(batch.id)}
                    className="px-3 py-1 text-sm border rounded hover:bg-accent"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => {
                      /* TODO: View codes */
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-accent"
                  >
                    View Codes
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Usage</span>
                  <span>
                    {Math.round((batch.usedCodes / batch.totalCodes) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(batch.usedCodes / batch.totalCodes) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create Code Batch</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateBatch({
                  name: formData.get("name"),
                  prefix: formData.get("prefix"),
                  quantity: Number(formData.get("quantity")),
                  usesPerCode: Number(formData.get("usesPerCode")),
                  description: formData.get("description")
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Batch Name
                </label>
                <input
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Launch Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prefix (optional)
                </label>
                <input
                  name="prefix"
                  type="text"
                  maxLength={10}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., LAUNCH"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity *
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  className="w-full px-3 py-2 border rounded"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Uses Per Code *
                </label>
                <input
                  name="usesPerCode"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
