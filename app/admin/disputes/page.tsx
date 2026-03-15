// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { toast } from "sonner";
import { AuthGuard } from "@/components/somago/auth-guard";

const ISSUE_LABELS: Record<string, string> = {
  damaged: "Item Damaged",
  wrong_item: "Wrong Item Received",
  not_received: "Item Not Received",
};

export default function AdminDisputesPage() {
  return (
    <AuthGuard message="Please sign in to manage disputes." requiredRole="admin">
      <AdminDisputesPageContent />
    </AuthGuard>
  );
}

function AdminDisputesPageContent() {
  const disputes = useQuery(api.disputes.listEscalated);
  const resolve = useMutation(api.disputes.resolve);

  if (disputes === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleResolve = async (disputeId: string, type: "refund" | "replacement" | "rejected") => {
    try {
      await resolve({
        disputeId: disputeId as any,
        type,
        reason: type === "rejected" ? "Insufficient evidence" : undefined,
      });
      const messages = {
        refund: "Refund approved and credited to buyer",
        replacement: "Replacement ordered",
        rejected: "Dispute rejected",
      };
      toast.success(messages[type]);
    } catch (e: any) {
      toast.error(e.message || "Failed to resolve dispute");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">
        Escalated Disputes ({disputes.length})
      </h1>

      {disputes.length === 0 ? (
        <EmptyState
          title="No escalated disputes"
          description="All disputes are resolved or being handled by sellers."
          icon={<span className="text-3xl">⚖️</span>}
        />
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div
              key={dispute._id}
              className="rounded-lg border-2 border-red-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {ISSUE_LABELS[dispute.issueType] ?? dispute.issueType}
                  </p>
                  <p className="font-mono text-xs text-neutral-500">
                    Order #{dispute.orderId.toString().slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Escalated{" "}
                    {dispute.escalatedAt
                      ? new Date(dispute.escalatedAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
                <Badge className="bg-red-100 text-red-800">Escalated</Badge>
              </div>

              {dispute.description && (
                <p className="mt-2 text-sm text-neutral-700">{dispute.description}</p>
              )}

              {dispute.sellerResponse && (
                <div className="mt-2 rounded bg-blue-50 p-2">
                  <p className="text-xs font-medium text-blue-700">Seller offered: {dispute.sellerResponse.type}</p>
                  {dispute.sellerResponse.message && (
                    <p className="text-xs text-blue-600">{dispute.sellerResponse.message}</p>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => handleResolve(dispute._id, "refund")}
                >
                  Approve Refund
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(dispute._id, "replacement")}
                >
                  Order Replacement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-error hover:bg-red-50"
                  onClick={() => handleResolve(dispute._id, "rejected")}
                >
                  Reject Claim
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
