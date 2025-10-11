"use client";

import { useEffect, useState } from "react";
import { trpc } from "@web/trpc";
import { toast } from "sonner";

interface PolicyGateProps {
  tenantId: string;
  poolId?: string;
  children: React.ReactNode;
}

export function PolicyGate({ tenantId, poolId, children }: PolicyGateProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<"TERMS" | "PRIVACY" | null>(
    null
  );

  // Check consent status
  const { data: consentStatus, refetch } = trpc.consent.getConsentStatus.useQuery({
    tenantId,
    poolId,
  });

  // Fetch current policies
  const { data: termsPolicy } = trpc.policies.getCurrent.useQuery(
    { tenantId, poolId, type: "TERMS" },
    { enabled: !!consentStatus && !consentStatus.terms.hasConsented }
  );

  const { data: privacyPolicy } = trpc.policies.getCurrent.useQuery(
    { tenantId, poolId, type: "PRIVACY" },
    { enabled: !!consentStatus && !consentStatus.privacy.hasConsented }
  );

  // Accept mutation
  const acceptMutation = trpc.consent.accept.useMutation({
    onSuccess: () => {
      toast.success("Consent recorded");
      refetch();
      setSelectedPolicy(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (consentStatus && !consentStatus.allAccepted) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [consentStatus]);

  const handleAcceptAll = async () => {
    const promises = [];

    if (consentStatus?.terms.required && !consentStatus.terms.hasConsented) {
      promises.push(
        acceptMutation.mutateAsync({
          tenantId,
          poolId,
          policyType: "TERMS",
          version: consentStatus.terms.currentVersion!,
        })
      );
    }

    if (consentStatus?.privacy.required && !consentStatus.privacy.hasConsented) {
      promises.push(
        acceptMutation.mutateAsync({
          tenantId,
          poolId,
          policyType: "PRIVACY",
          version: consentStatus.privacy.currentVersion!,
        })
      );
    }

    try {
      await Promise.all(promises);
      setShowModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!showModal || consentStatus?.allAccepted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">Accept Policies to Continue</h2>
            <p className="text-gray-600 mt-1">
              Please review and accept our policies before proceeding.
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedPolicy ? (
              <div>
                <button
                  className="text-blue-600 hover:underline mb-4"
                  onClick={() => setSelectedPolicy(null)}
                >
                  ← Back
                </button>
                <h3 className="text-xl font-semibold mb-4">
                  {selectedPolicy === "TERMS"
                    ? termsPolicy?.title
                    : privacyPolicy?.title}
                </h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                    {selectedPolicy === "TERMS"
                      ? termsPolicy?.content
                      : privacyPolicy?.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {consentStatus?.terms.required &&
                  !consentStatus.terms.hasConsented && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Terms & Conditions</h3>
                          <p className="text-sm text-gray-600">
                            Version {consentStatus.terms.currentVersion}
                          </p>
                        </div>
                        <button
                          className="text-blue-600 hover:underline text-sm"
                          onClick={() => setSelectedPolicy("TERMS")}
                        >
                          Read
                        </button>
                      </div>
                    </div>
                  )}

                {consentStatus?.privacy.required &&
                  !consentStatus.privacy.hasConsented && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Privacy Policy</h3>
                          <p className="text-sm text-gray-600">
                            Version {consentStatus.privacy.currentVersion}
                          </p>
                        </div>
                        <button
                          className="text-blue-600 hover:underline text-sm"
                          onClick={() => setSelectedPolicy("PRIVACY")}
                        >
                          Read
                        </button>
                      </div>
                    </div>
                  )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800">
                    By clicking "Accept All", you agree to our Terms & Conditions
                    and Privacy Policy. You can review each policy by clicking the
                    "Read" link above.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!selectedPolicy && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                onClick={handleAcceptAll}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? "Processing..." : "Accept All"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Blocked content (grayed out) */}
      <div className="pointer-events-none opacity-50">{children}</div>
    </>
  );
}
