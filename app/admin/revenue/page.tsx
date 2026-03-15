// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function RevenueDashboardPage() {
  const health = useQuery(api.health.getSystemHealth);
  const subscriptions = useQuery(api.subscriptions.adminListSubscriptions);

  if (health === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!health) {
    return <p className="text-sm text-neutral-500">Admin access required.</p>;
  }

  // Calculate revenue estimates using weighted average commission
  // Mix of free (5%), premium (3%), enterprise (2%) sellers
  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") ?? [];
  const premiumCount = activeSubscriptions.filter((s) => s.plan === "premium").length;
  const enterpriseCount = activeSubscriptions.filter((s) => s.plan === "enterprise").length;
  const totalPaidSellers = premiumCount + enterpriseCount;

  // Weighted average commission (approximate — assumes even GMV distribution)
  const avgCommission = totalPaidSellers > 0
    ? ((health.totalUsers - totalPaidSellers) * 0.05 + premiumCount * 0.03 + enterpriseCount * 0.02) / Math.max(health.totalUsers, 1)
    : 0.05;

  const commissionRevenue24h = health.gmv24h * avgCommission;
  const commissionRevenue7d = health.gmv7d * avgCommission;
  const commissionRevenue30d = health.gmv30d * avgCommission;

  // Subscription revenue
  const monthlySubRevenue = premiumCount * 999 + enterpriseCount * 4999;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Revenue Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Platform revenue from commissions and subscriptions.</p>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Commission Revenue (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary-600">
              ₱{Math.round(commissionRevenue24h).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">From ₱{Math.round(health.gmv24h).toLocaleString()} GMV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Commission Revenue (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary-600">
              ₱{Math.round(commissionRevenue7d).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">From ₱{Math.round(health.gmv7d).toLocaleString()} GMV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Commission Revenue (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary-600">
              ₱{Math.round(commissionRevenue30d).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">From ₱{Math.round(health.gmv30d).toLocaleString()} GMV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Subscription Revenue (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent-orange">
              ₱{monthlySubRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">
              {premiumCount} Premium + {enterpriseCount} Enterprise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-neutral-700">Total GMV (30d)</span>
              <span className="font-medium">₱{Math.round(health.gmv30d).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-neutral-700">Avg. Commission Rate</span>
              <span className="font-medium">~{(avgCommission * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-neutral-700">Total Orders (30d)</span>
              <span className="font-medium">{health.totalOrders30d}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-sm text-neutral-700">Active Products</span>
              <span className="font-medium">{health.activeProductsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">Est. Monthly Commission</span>
              <span className="text-lg font-bold text-primary-600">
                ₱{Math.round(commissionRevenue30d).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSubscriptions.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">No active subscriptions yet.</p>
            ) : (
              <div className="space-y-2">
                {activeSubscriptions.slice(0, 10).map((sub) => (
                  <div key={sub._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-neutral-900">{sub.sellerName || "Seller"}</span>
                      <Badge className="ml-2 text-[10px]" variant={sub.plan === "enterprise" ? "default" : "secondary"}>
                        {sub.plan}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-primary-600">₱{sub.amount.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.totalUsers}</p>
              <p className="text-xs text-neutral-500">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.activeUsers}</p>
              <p className="text-xs text-neutral-500">Active Users (7d)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.totalOrders7d}</p>
              <p className="text-xs text-neutral-500">Orders (7d)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.activeProductsCount}</p>
              <p className="text-xs text-neutral-500">Active Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.openDisputesCount}</p>
              <p className="text-xs text-neutral-500">Open Disputes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{health.activeLiveRoomsCount}</p>
              <p className="text-xs text-neutral-500">Live Rooms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
