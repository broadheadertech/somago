// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "@/components/somago/auth-guard";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function SellerPayoutsPage() {
  return (
    <AuthGuard requiredRole="seller" message="Seller access required.">
      <PayoutsContent />
    </AuthGuard>
  );
}

function PayoutsContent() {
  const summary = useQuery(api.payouts.getSellerPayoutSummary);
  const history = useQuery(api.payouts.getPayoutHistory);
  const requestPayout = useMutation(api.payouts.requestPayout);
  const [isRequesting, setIsRequesting] = useState(false);

  if (summary === undefined || history === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-neutral-500">Unable to load payout information.</p>
      </div>
    );
  }

  const handleRequestPayout = async () => {
    setIsRequesting(true);
    try {
      await requestPayout();
      toast.success("Payout request submitted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to request payout");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <h1 className="mb-6 text-xl font-bold text-neutral-900">Payouts</h1>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Pending Earnings */}
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Pending Earnings</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">
            ₱{summary.pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            After {(summary.commissionRate * 100).toFixed(0)}% commission
          </p>
        </div>

        {/* Total Paid */}
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Total Paid Out</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            ₱{summary.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {summary.deliveredOrdersCount} delivered orders
          </p>
        </div>

        {/* Commission Deducted */}
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Commission Deducted</p>
          <p className="mt-1 text-2xl font-bold text-neutral-700">
            ₱{summary.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {(summary.commissionRate * 100).toFixed(0)}% platform fee
          </p>
        </div>
      </div>

      {/* Request Payout Button */}
      <div className="mb-6">
        <Button
          className="w-full bg-primary-600 hover:bg-primary-700 sm:w-auto"
          onClick={handleRequestPayout}
          disabled={isRequesting || summary.pendingEarnings < 500}
        >
          {isRequesting ? "Requesting..." : "Request Payout"}
        </Button>
        {summary.pendingEarnings < 500 && (
          <p className="mt-2 text-xs text-neutral-500">
            Minimum payout is ₱500. You need ₱{Math.max(0, 500 - summary.pendingEarnings).toFixed(2)} more.
          </p>
        )}
      </div>

      {/* Payout History */}
      <div className="rounded-lg border border-border bg-white">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Payout History</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500">No payouts yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((payout) => (
              <div key={payout._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    ₱{payout.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Gross: ₱{payout.amount.toLocaleString()} | Commission: ₱{payout.commission.toLocaleString()} | {payout.ordersIncluded} orders
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(payout.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" — Period: "}
                    {new Date(payout.periodStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    {" to "}
                    {new Date(payout.periodEnd).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[payout.status] ?? "bg-gray-100 text-gray-800"}>
                  {payout.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
