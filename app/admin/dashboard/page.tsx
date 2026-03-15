// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function AdminDashboardPage() {
  return (
    <AuthGuard message="Please sign in to access the Admin Dashboard." requiredRole="admin">
      <AdminDashboardPageContent />
    </AuthGuard>
  );
}

function AdminDashboardPageContent() {
  const users = useQuery(api.users.listAllUsers, {});
  const pendingSellers = useQuery(api.users.listSellerApplications);
  const flaggedProducts = useQuery(api.products.listFlagged);
  const disputes = useQuery(api.disputes.listEscalated);
  const allOrders = useQuery(api.orders.listAll, {});

  const loading =
    users === undefined ||
    pendingSellers === undefined ||
    flaggedProducts === undefined ||
    allOrders === undefined;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const escalatedCount = disputes?.length ?? 0;
  const flaggedCount = flaggedProducts?.length ?? 0;
  const pendingSellerCount = pendingSellers?.length ?? 0;
  const totalGMV = allOrders
    ?.filter((o) => o.orderStatus !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/admin/disputes"
          className="rounded-lg border-2 border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
        >
          <p className="text-xs font-medium uppercase text-red-600">Escalated Disputes</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{escalatedCount}</p>
          {escalatedCount > 0 && <p className="text-xs text-red-500">Action needed</p>}
        </Link>

        <Link
          href="/admin/moderation"
          className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100"
        >
          <p className="text-xs font-medium uppercase text-yellow-600">Flagged Products</p>
          <p className="mt-1 text-2xl font-bold text-yellow-700">{flaggedCount}</p>
        </Link>

        <Link
          href="/admin/sellers"
          className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
        >
          <p className="text-xs font-medium uppercase text-blue-600">Seller Applications</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{pendingSellerCount}</p>
        </Link>

        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <p className="text-xs font-medium uppercase text-green-600">Total GMV</p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            ₱{totalGMV.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Total Users</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">{users?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Buyers</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {users?.filter((u) => u.role === "buyer").length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Sellers</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {users?.filter((u) => u.role === "seller").length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Total Orders</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">{allOrders?.length ?? 0}</p>
        </div>
      </div>

      {/* Priority Queue */}
      <div className="rounded-lg border border-border bg-white">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Priority Queue</h2>
        </div>
        <div className="divide-y divide-border">
          {escalatedCount === 0 && flaggedCount === 0 && pendingSellerCount === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl">✅</p>
              <p className="mt-2 text-sm font-medium text-green-700">All Queues Clear</p>
              <p className="text-xs text-neutral-500">No items need attention</p>
            </div>
          ) : (
            <>
              {escalatedCount > 0 && (
                <Link href="/admin/disputes" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-neutral-900">{escalatedCount} escalated dispute{escalatedCount !== 1 ? "s" : ""}</span>
                  <Badge className="ml-auto bg-red-100 text-red-800">Critical</Badge>
                </Link>
              )}
              {flaggedCount > 0 && (
                <Link href="/admin/moderation" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-neutral-900">{flaggedCount} flagged product{flaggedCount !== 1 ? "s" : ""}</span>
                  <Badge className="ml-auto bg-yellow-100 text-yellow-800">Review</Badge>
                </Link>
              )}
              {pendingSellerCount > 0 && (
                <Link href="/admin/sellers" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-neutral-900">{pendingSellerCount} seller application{pendingSellerCount !== 1 ? "s" : ""}</span>
                  <Badge className="ml-auto bg-blue-100 text-blue-800">Pending</Badge>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
