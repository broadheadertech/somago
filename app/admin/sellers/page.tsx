// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { toast } from "sonner";
import { useState } from "react";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function AdminSellersPage() {
  return (
    <AuthGuard message="Please sign in to manage seller applications." requiredRole="admin">
      <AdminSellersPageContent />
    </AuthGuard>
  );
}

function AdminSellersPageContent() {
  const applications = useQuery(api.users.listSellerApplications);
  const reviewApplication = useMutation(api.users.reviewSellerApplication);
  const batchReview = useMutation(api.users.batchReviewSellerApplications);
  const addStrike = useMutation(api.users.addStrike);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [strikeTarget, setStrikeTarget] = useState<string | null>(null);
  const [strikeReason, setStrikeReason] = useState("");

  if (applications === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === applications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(applications.map((a) => a._id)));
    }
  };

  const handleBatch = async (decision: "approved" | "rejected") => {
    if (selected.size === 0) return;
    setIsBatchProcessing(true);
    try {
      const result = await batchReview({
        userIds: Array.from(selected) as any,
        decision,
      });
      toast.success(`${result.processed} seller(s) ${decision}!`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message || "Batch operation failed");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleStrike = async () => {
    if (!strikeTarget || !strikeReason) return;
    try {
      const result = await addStrike({ userId: strikeTarget as any, reason: strikeReason });
      if (result.suspended) {
        toast.error(`Seller suspended after ${result.strikes} strikes!`);
      } else {
        toast.success(`Strike ${result.strikes}/3 issued.`);
      }
      setStrikeTarget(null);
      setStrikeReason("");
    } catch (e: any) {
      toast.error(e.message || "Failed to issue strike");
    }
  };

  const handleReview = async (userId: string, decision: "approved" | "rejected") => {
    try {
      await reviewApplication({ userId: userId as any, decision });
      toast.success(`Seller ${decision}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to process application");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">
          Seller Applications ({applications.length})
        </h1>

        {/* Batch Actions */}
        {applications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              className="text-xs text-primary-600 hover:underline"
            >
              {selected.size === applications.length ? "Deselect all" : "Select all"}
            </button>
            {selected.size > 0 && (
              <>
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700"
                  disabled={isBatchProcessing}
                  onClick={() => handleBatch("approved")}
                >
                  Approve {selected.size}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-error hover:bg-red-50"
                  disabled={isBatchProcessing}
                  onClick={() => handleBatch("rejected")}
                >
                  Reject {selected.size}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No pending applications"
          description="All seller applications have been processed."
          icon={<span className="text-3xl">✅</span>}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((user) => (
            <div
              key={user._id}
              className={`rounded-lg border bg-white p-4 transition-colors ${
                selected.has(user._id) ? "border-primary-400 bg-primary-50" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(user._id)}
                  onChange={() => toggleSelect(user._id)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{user.name}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                      <p className="text-xs text-neutral-500">
                        Joined {new Date(user.createdAt).toLocaleDateString("en-PH")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.strikeCount > 0 && (
                        <Badge className="bg-red-100 text-red-800">
                          {user.strikeCount} strike{user.strikeCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </div>

                  {user.businessDetails && (
                    <div className="mt-2 rounded bg-neutral-50 p-2">
                      <p className="text-xs text-neutral-500">Business Details</p>
                      <p className="text-sm text-neutral-900">
                        {user.businessDetails.businessName}
                        {user.businessDetails.businessType && ` (${user.businessDetails.businessType})`}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={() => handleReview(user._id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-error hover:bg-red-50"
                      onClick={() => handleReview(user._id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strike Dialog */}
      {strikeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Issue Strike</h3>
            <textarea
              value={strikeReason}
              onChange={(e) => setStrikeReason(e.target.value)}
              placeholder="Reason for strike..."
              className="mt-3 w-full rounded-lg border border-border p-3 text-sm"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStrikeTarget(null); setStrikeReason(""); }}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                disabled={!strikeReason}
                onClick={handleStrike}
              >
                Issue Strike
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
