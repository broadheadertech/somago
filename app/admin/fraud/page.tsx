// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { AuthGuard } from "@/components/somago/auth-guard";
import { toast } from "sonner";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-neutral-100 text-neutral-600",
};

export default function AdminFraudPage() {
  return (
    <AuthGuard message="Please sign in to manage fraud flags." requiredRole="admin">
      <AdminFraudPageContent />
    </AuthGuard>
  );
}

function AdminFraudPageContent() {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [severityFilter, setSeverityFilter] = useState<string>("");

  const flags = useQuery(api.fraud.listFlags, {
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  } as any);
  const resolveFlag = useMutation(api.fraud.resolveFlag);

  const handleResolve = async (flagId: string, action: "resolved" | "dismissed") => {
    try {
      await resolveFlag({ flagId: flagId as any, action });
      toast.success(action === "resolved" ? "Flag resolved" : "Flag dismissed");
    } catch (e: any) {
      toast.error(e.message || "Failed to update flag");
    }
  };

  if (flags === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Fraud Detection</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          <span className="self-center text-xs font-medium text-neutral-500 mr-1">Status:</span>
          {["open", "investigating", "resolved", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="self-center text-xs font-medium text-neutral-500 mr-1">Severity:</span>
          {["low", "medium", "high"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(severityFilter === s ? "" : s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                severityFilter === s
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Flags List */}
      {flags.length === 0 ? (
        <EmptyState
          title="No fraud flags"
          description="No fraud flags match the current filters."
          icon={<span className="text-3xl">🛡</span>}
        />
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag._id}
              className="rounded-lg border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={SEVERITY_STYLES[flag.severity]}>
                      {flag.severity}
                    </Badge>
                    <Badge className={STATUS_STYLES[flag.status]}>
                      {flag.status}
                    </Badge>
                    <Badge className="bg-neutral-100 text-neutral-600">
                      {flag.targetType}
                    </Badge>
                    <span className="text-[10px] text-neutral-400">
                      {flag.detectedBy === "system" ? "Auto-detected" : flag.detectedBy === "admin" ? "Admin" : "User Report"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-900 font-medium">{flag.reason}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Target: <span className="font-mono">{flag.targetId.slice(-8).toUpperCase()}</span>
                    {" · "}
                    {new Date(flag.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {(flag.status === "open" || flag.status === "investigating") && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={() => handleResolve(flag._id, "resolved")}
                  >
                    Investigate & Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(flag._id, "dismissed")}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
