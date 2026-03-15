// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function SystemHealthPage() {
  return (
    <AuthGuard message="Please sign in to access System Health." requiredRole="admin">
      <SystemHealthContent />
    </AuthGuard>
  );
}

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StatusIndicator({ health }: { health: any }) {
  // Determine overall status based on key metrics
  const hasHighDisputes = health.openDisputesCount > 10;
  const hasHighTickets = health.openTicketsCount > 20;
  const hasPendingApps = health.pendingApplicationsCount > 10;

  let color = "bg-green-500";
  let label = "Healthy";
  let ringColor = "ring-green-200";
  let textColor = "text-green-700";

  if (hasHighDisputes || hasHighTickets) {
    color = "bg-red-500";
    label = "Needs Attention";
    ringColor = "ring-red-200";
    textColor = "text-red-700";
  } else if (hasPendingApps || health.openDisputesCount > 5 || health.openTicketsCount > 10) {
    color = "bg-yellow-500";
    label = "Warning";
    ringColor = "ring-yellow-200";
    textColor = "text-yellow-700";
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${color} ring-4 ${ringColor}`} />
      <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  subLabel,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  accent?: "neutral" | "green" | "blue" | "red" | "yellow" | "purple";
}) {
  const accentClasses = {
    neutral: "border-border bg-white",
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    red: "border-red-200 bg-red-50",
    yellow: "border-yellow-200 bg-yellow-50",
    purple: "border-purple-200 bg-purple-50",
  };

  const labelClasses = {
    neutral: "text-neutral-500",
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
  };

  const valueClasses = {
    neutral: "text-neutral-900",
    green: "text-green-800",
    blue: "text-blue-800",
    red: "text-red-800",
    yellow: "text-yellow-800",
    purple: "text-purple-800",
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${accentClasses[accent]}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${labelClasses[accent]}`}>
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueClasses[accent]}`}>{value}</p>
      {subLabel && (
        <p className={`mt-0.5 text-xs ${labelClasses[accent]} opacity-80`}>{subLabel}</p>
      )}
    </div>
  );
}

function SystemHealthContent() {
  const health = useQuery(api.health.getSystemHealth);

  if (health === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (health === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-500">Unable to load system health data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-900">System Health</h1>
          <StatusIndicator health={health} />
        </div>
        <p className="text-xs text-neutral-400">Real-time via Convex</p>
      </div>

      {/* Users Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Users
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Users"
            value={health.totalUsers.toLocaleString()}
            accent="blue"
          />
          <StatCard
            label="Active Users (7d)"
            value={health.activeUsers.toLocaleString()}
            subLabel={`${health.totalUsers > 0 ? Math.round((health.activeUsers / health.totalUsers) * 100) : 0}% of total`}
            accent="blue"
          />
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Orders
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Orders (24h)"
            value={health.totalOrders24h.toLocaleString()}
            accent="green"
          />
          <StatCard
            label="Orders (7d)"
            value={health.totalOrders7d.toLocaleString()}
            accent="green"
          />
          <StatCard
            label="Orders (30d)"
            value={health.totalOrders30d.toLocaleString()}
            accent="green"
          />
        </div>
      </div>

      {/* GMV Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Gross Merchandise Value
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="GMV (24h)"
            value={formatCurrency(health.gmv24h)}
            accent="green"
          />
          <StatCard
            label="GMV (7d)"
            value={formatCurrency(health.gmv7d)}
            accent="green"
          />
          <StatCard
            label="GMV (30d)"
            value={formatCurrency(health.gmv30d)}
            accent="green"
          />
        </div>
      </div>

      {/* Platform Status Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Platform Status
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Active Products"
            value={health.activeProductsCount.toLocaleString()}
            accent="neutral"
          />
          <StatCard
            label="Open Disputes"
            value={health.openDisputesCount}
            accent={health.openDisputesCount > 5 ? "red" : "neutral"}
          />
          <StatCard
            label="Open Tickets"
            value={health.openTicketsCount}
            accent={health.openTicketsCount > 10 ? "yellow" : "neutral"}
          />
          <StatCard
            label="Seller Applications"
            value={health.pendingApplicationsCount}
            accent={health.pendingApplicationsCount > 0 ? "purple" : "neutral"}
          />
          <StatCard
            label="Flash Sales"
            value={health.activeFlashSalesCount}
            accent="neutral"
          />
          <StatCard
            label="Live Rooms"
            value={health.activeLiveRoomsCount}
            accent={health.activeLiveRoomsCount > 0 ? "blue" : "neutral"}
          />
        </div>
      </div>
    </div>
  );
}
