"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function PoolAwardsPage() {
  const params = useParams();
  const poolId = params.id as string;

  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "delivered" | "pending">("all");
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedAward, setSelectedAward] = useState<any>(null);

  // TODO: Fetch awards using tRPC
  // const { data, isLoading } = trpc.awards.listByPool.useQuery({ poolId, tenantId });

  const handleExportCsv = async () => {
    try {
      // TODO: Call tRPC query and download CSV
      // const data = await exportCsv.mutateAsync({ poolId, tenantId });
      toast.success("CSV exported successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to export CSV");
    }
  };

  const handleRecordEvidence = async (awardId: string, evidence: any) => {
    try {
      // TODO: Call tRPC mutation
      // await recordEvidence.mutateAsync({ awardId, ...evidence });
      toast.success("Evidence recorded successfully");
      setShowEvidenceModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to record evidence");
    }
  };

  const filteredAwards = awards.filter((award) => {
    if (filter === "delivered") return award.deliveredAt;
    if (filter === "pending") return !award.deliveredAt;
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prize Awards</h1>
          <p className="text-muted-foreground mt-1">
            View and manage prize awards for winners
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 border rounded-md hover:bg-accent"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          }`}
        >
          All ({awards.length})
        </button>
        <button
          onClick={() => setFilter("delivered")}
          className={`px-4 py-2 rounded-md ${
            filter === "delivered"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          }`}
        >
          Delivered ({awards.filter((a) => a.deliveredAt).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-md ${
            filter === "pending"
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          }`}
        >
          Pending ({awards.filter((a) => !a.deliveredAt).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading awards...</p>
        </div>
      ) : filteredAwards.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "No awards yet. Run the finalize pool job to award prizes."
              : `No ${filter} awards`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAwards.map((award) => (
            <div
              key={award.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      Rank #{award.rank}
                    </span>
                    <h3 className="text-lg font-semibold">{award.prize.title}</h3>
                    {award.deliveredAt && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Delivered
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Winner:</span> {award.user.name || award.user.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {award.user.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Prize Type:</span> {award.prize.type}
                    </p>
                    {award.prize.value && (
                      <p className="text-sm">
                        <span className="font-medium">Value:</span> {award.prize.value}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Awarded: {new Date(award.awardedAt).toLocaleDateString()}
                    </p>
                    {award.deliveredAt && (
                      <p className="text-sm text-muted-foreground">
                        Delivered: {new Date(award.deliveredAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {award.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                      <span className="font-medium">Notes:</span> {award.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedAward(award);
                      setShowEvidenceModal(true);
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-accent"
                  >
                    {award.deliveredAt ? "Update Evidence" : "Record Delivery"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Modal */}
      {showEvidenceModal && selectedAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Record Delivery Evidence</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Add delivery notes or tracking information..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Evidence URL (optional)
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRecordEvidence(selectedAward.id, {})}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
