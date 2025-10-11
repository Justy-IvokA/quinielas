"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";

export default function PoliciesPage() {
  const t = useTranslations("policies");
  const [tenantId, setTenantId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"TERMS" | "PRIVACY">("TERMS");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Fetch policies
  const { data: policies, isLoading, refetch } = trpc.policies.list.useQuery(
    { tenantId: tenantId || "" },
    { enabled: !!tenantId }
  );

  // Publish mutation
  const publishMutation = trpc.policies.publish.useMutation({
    onSuccess: () => {
      toast.success("Policy published successfully");
      setIsEditing(false);
      setTitle("");
      setContent("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePublish = () => {
    if (!tenantId || !title || !content) {
      toast.error("Please fill in all fields");
      return;
    }

    publishMutation.mutate({
      tenantId,
      type: selectedType,
      title,
      content,
    });
  };

  const filteredPolicies = policies?.filter((p) => p.type === selectedType) ?? [];
  const currentPolicy = filteredPolicies[0]; // Latest version

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("title", { default: "Policies" })}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please select a tenant from the navigation to manage policies.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">{t("title", { default: "Policies" })}</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">{t("title", { default: "Policies" })}</h1>

      {/* Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            selectedType === "TERMS"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setSelectedType("TERMS")}
        >
          Terms & Conditions
        </button>
        <button
          className={`px-4 py-2 rounded ${
            selectedType === "PRIVACY"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setSelectedType("PRIVACY")}
        >
          Privacy Policy
        </button>
      </div>

      {/* Current Policy */}
      {currentPolicy && !isEditing && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{currentPolicy.title}</h2>
              <p className="text-sm text-gray-500">
                Version {currentPolicy.version} • Published{" "}
                {new Date(currentPolicy.publishedAt).toLocaleDateString()}
              </p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Current
            </span>
          </div>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {currentPolicy.content}
            </pre>
          </div>
        </div>
      )}

      {/* Editor */}
      {isEditing ? (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Publish New {selectedType === "TERMS" ? "Terms" : "Privacy"} Version
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Terms and Conditions v2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Content (Markdown supported)
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 font-mono text-sm"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter policy content..."
              />
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? "Publishing..." : "Publish"}
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                onClick={() => {
                  setIsEditing(false);
                  setTitle("");
                  setContent("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
          onClick={() => setIsEditing(true)}
        >
          Publish New Version
        </button>
      )}

      {/* Version History */}
      {filteredPolicies.length > 1 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Version History</h2>
          <div className="space-y-2">
            {filteredPolicies.slice(1).map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{policy.title}</p>
                  <p className="text-sm text-gray-500">
                    Version {policy.version} •{" "}
                    {new Date(policy.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
