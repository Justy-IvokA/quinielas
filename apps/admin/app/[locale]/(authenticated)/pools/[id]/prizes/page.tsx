"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PoolPrizesPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;

  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // TODO: Fetch prizes using tRPC
  // const { data, isLoading } = trpc.prizes.listByPool.useQuery({ poolId });

  const handleAddPrize = () => {
    setShowAddModal(true);
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm("Are you sure you want to delete this prize?")) return;

    try {
      // TODO: Call tRPC mutation
      // await deletePrize.mutateAsync({ id: prizeId });
      toast.success("Prize deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete prize");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prizes</h1>
          <p className="text-muted-foreground mt-1">
            Configure prizes and rank ranges for this pool
          </p>
        </div>
        <button
          onClick={handleAddPrize}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Prize
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading prizes...</p>
        </div>
      ) : prizes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No prizes configured yet</p>
          <button
            onClick={handleAddPrize}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Add First Prize
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{prize.title}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {prize.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ranks {prize.rankFrom}-{prize.rankTo}
                  </p>
                  {prize.description && (
                    <p className="text-sm mt-2">{prize.description}</p>
                  )}
                  {prize.value && (
                    <p className="text-sm font-medium mt-2">Value: {prize.value}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      /* TODO: Edit */
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-accent"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePrize(prize.id)}
                    className="px-3 py-1 text-sm border border-destructive text-destructive rounded hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add Prize Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add Prize</h2>
            {/* Form fields here */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-accent"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
