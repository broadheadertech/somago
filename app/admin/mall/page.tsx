// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminMallPage() {
  const applications = useQuery(api.mall.listApplications, {});
  const reviewApplication = useMutation(api.mall.reviewApplication);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleReview = async (appId: string, status: "approved" | "rejected") => {
    try {
      await reviewApplication({
        applicationId: appId as any,
        status,
        adminNotes: notes[appId] || undefined,
      });
      toast.success(`Application ${status}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to review");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Somago Mall Applications</h1>
        <p className="mt-1 text-sm text-neutral-500">Review and manage brand store applications.</p>
      </div>

      {applications === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : applications.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">No mall applications yet.</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app._id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-900">{app.brandName}</h3>
                    <Badge
                      variant={app.status === "pending" ? "secondary" : app.status === "approved" ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {app.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    Seller: {app.sellerName || "Unknown"} • Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-neutral-700">{app.brandDescription}</p>

              {app.businessRegistration && (
                <p className="mt-2 text-xs text-neutral-500">
                  Business Registration: {app.businessRegistration}
                </p>
              )}

              {app.status === "pending" && (
                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  <Textarea
                    placeholder="Admin notes (optional)"
                    value={notes[app._id] || ""}
                    onChange={(e) => setNotes({ ...notes, [app._id]: e.target.value })}
                    className="h-16"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={() => handleReview(app._id, "approved")}
                    >
                      Approve for Mall
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReview(app._id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {app.adminNotes && (
                <p className="mt-2 text-xs text-neutral-500 italic">
                  Admin notes: {app.adminNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
