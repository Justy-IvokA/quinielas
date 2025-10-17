"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";

export default function AuditPage() {
  const t = useTranslations("audit");
  const [tenantId, setTenantId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    action: "",
    userEmail: "",
  });

  // Fetch audit logs
  const { data, isLoading } = trpc.audit.search.useQuery(
    {
      tenantId: tenantId || "",
      page,
      pageSize: 50,
      ...filters,
    },
    { enabled: !!tenantId }
  );

  // Export mutation
  const exportMutation = trpc.audit.export.useMutation({
    onSuccess: (result) => {
      // Create download
      const blob = new Blob([result.data], {
        type: result.format === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${result.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} audit logs`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExport = (format: "csv" | "json") => {
    if (!tenantId) return;
    exportMutation.mutate({
      tenantId,
      format,
      ...filters,
    });
  };

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("title", { default: "Audit Logs" })}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please select a tenant from the navigation to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">{t("title", { default: "Audit Logs" })}</h1>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  startDate: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  endDate: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., SETTING_UPSERT"
              value={filters.action}
              onChange={(e) =>
                setFilters((f) => ({ ...f, action: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">User Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="user@example.com"
              value={filters.userEmail}
              onChange={(e) =>
                setFilters((f) => ({ ...f, userEmail: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={() => handleExport("csv")}
            disabled={exportMutation.isPending}
          >
            Export CSV
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={() => handleExport("json")}
            disabled={exportMutation.isPending}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.actor?.email ?? "System"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.ipAddress ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.metadata && (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:underline">
                              View
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing page {data.page} of {data.totalPages} ({data.total} total
                logs)
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
