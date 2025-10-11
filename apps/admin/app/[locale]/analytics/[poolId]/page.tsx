"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const params = useParams();
  const poolId = params.poolId as string;

  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [loading, setLoading] = useState(true);

  // TODO: Fetch analytics data using tRPC
  // const { data: adoptionData } = trpc.analytics.adoption.useQuery({ poolId, tenantId, ...dateRange });
  // const { data: predictionsData } = trpc.analytics.predictions.useQuery({ poolId, tenantId, ...dateRange });
  // const { data: trafficData } = trpc.analytics.traffic.useQuery({ poolId, tenantId, ...dateRange });

  const mockAdoptionData = {
    totalRegistrations: 0,
    registrationsByDay: [],
    invitations: { total: 0, accepted: 0, activationRate: 0 },
    predictions: { usersWithPredictions: 0, completionRate: 0 }
  };

  const mockPredictionsData = {
    total: 0,
    byMatchday: [],
    timing: { onTime: 0, onTimeRate: 0 },
    accuracy: { exact: 0, sign: 0 }
  };

  const mockTrafficData = {
    registrationsByHour: [],
    topActions: []
  };

  const handleExportJson = () => {
    const data = {
      adoption: mockAdoptionData,
      predictions: mockPredictionsData,
      traffic: mockTrafficData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${poolId}-${new Date().toISOString()}.json`;
    a.click();
    toast.success("Analytics exported");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Pool performance and engagement metrics
          </p>
        </div>
        <button
          onClick={handleExportJson}
          className="px-4 py-2 border rounded-md hover:bg-accent"
        >
          Export JSON
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-4 mb-6 p-4 border rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            className="px-3 py-2 border rounded"
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: e.target.value ? new Date(e.target.value) : undefined
              }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            className="px-3 py-2 border rounded"
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: e.target.value ? new Date(e.target.value) : undefined
              }))
            }
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setDateRange({})}
            className="px-4 py-2 border rounded hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Adoption Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Adoption Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Registrations</p>
            <p className="text-3xl font-bold">
              {mockAdoptionData.totalRegistrations}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Invitations Sent</p>
            <p className="text-3xl font-bold">
              {mockAdoptionData.invitations.total}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Activation Rate</p>
            <p className="text-3xl font-bold">
              {mockAdoptionData.invitations.activationRate}%
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Prediction Completion</p>
            <p className="text-3xl font-bold">
              {mockAdoptionData.predictions.completionRate}%
            </p>
          </div>
        </div>

        {/* Registrations Chart Placeholder */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Registrations Over Time</h3>
          <div className="h-64 flex items-center justify-center bg-muted rounded">
            <p className="text-muted-foreground">
              Chart: Registrations by day
              {mockAdoptionData.registrationsByDay.length > 0
                ? ` (${mockAdoptionData.registrationsByDay.length} data points)`
                : " (No data)"}
            </p>
          </div>
        </div>
      </section>

      {/* Predictions Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Predictions Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Predictions</p>
            <p className="text-3xl font-bold">{mockPredictionsData.total}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">On-Time Rate</p>
            <p className="text-3xl font-bold">
              {mockPredictionsData.timing.onTimeRate}%
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Exact Predictions</p>
            <p className="text-3xl font-bold">
              {mockPredictionsData.accuracy.exact}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Sign Predictions</p>
            <p className="text-3xl font-bold">
              {mockPredictionsData.accuracy.sign}
            </p>
          </div>
        </div>

        {/* Predictions by Matchday Chart Placeholder */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Predictions by Matchday
          </h3>
          <div className="h-64 flex items-center justify-center bg-muted rounded">
            <p className="text-muted-foreground">
              Chart: Predictions volume by matchday
              {mockPredictionsData.byMatchday.length > 0
                ? ` (${mockPredictionsData.byMatchday.length} matchdays)`
                : " (No data)"}
            </p>
          </div>
        </div>
      </section>

      {/* Traffic Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Traffic Metrics</h2>

        {/* Registrations by Hour Chart Placeholder */}
        <div className="border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Registration Peaks by Hour
          </h3>
          <div className="h-64 flex items-center justify-center bg-muted rounded">
            <p className="text-muted-foreground">
              Chart: Registrations by hour of day
              {mockTrafficData.registrationsByHour.length > 0
                ? ` (${mockTrafficData.registrationsByHour.length} hours)`
                : " (No data)"}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Actions</h3>
          {mockTrafficData.topActions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No action data available
            </p>
          ) : (
            <div className="space-y-2">
              {mockTrafficData.topActions.map((action: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <span className="font-medium">{action.action}</span>
                  <span className="text-muted-foreground">{action.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
