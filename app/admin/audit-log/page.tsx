// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function AuditLogPage() {
  return (
    <AuthGuard message="Please sign in to view audit logs." requiredRole="admin">
      <AuditLogPageContent />
    </AuthGuard>
  );
}

function AuditLogPageContent() {
  const logs = useQuery(api.auditLog.list);

  if (logs === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const targetTypeColors: Record<string, string> = {
    user: "bg-blue-100 text-blue-800",
    product: "bg-green-100 text-green-800",
    order: "bg-purple-100 text-purple-800",
    dispute: "bg-orange-100 text-orange-800",
    review: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Audit Log</h1>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No audit log entries yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-600">
                    {new Date(log.createdAt).toLocaleString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-neutral-900">
                    {log.adminName}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-700">
                    {log.action.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-[10px] ${targetTypeColors[log.targetType] || "bg-neutral-100 text-neutral-700"}`}
                    >
                      {log.targetType}
                    </Badge>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-neutral-500">
                    {log.details || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
