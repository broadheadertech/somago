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

export default function AdminModerationPage() {
  return (
    <AuthGuard message="Please sign in to moderate products." requiredRole="admin">
      <AdminModerationPageContent />
    </AuthGuard>
  );
}

function AdminModerationPageContent() {
  const flaggedProducts = useQuery(api.products.listFlagged);
  const moderate = useMutation(api.products.moderate);

  if (flaggedProducts === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleModerate = async (productId: string, action: "approve" | "warn" | "remove") => {
    try {
      await moderate({ productId: productId as any, action });
      const messages = {
        approve: "Product approved",
        warn: "Warning sent to seller (48hr correction window)",
        remove: "Product removed and strike issued",
      };
      toast.success(messages[action]);
    } catch (e: any) {
      toast.error(e.message || "Failed to moderate product");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">
        Product Moderation ({flaggedProducts.length})
      </h1>

      {flaggedProducts.length === 0 ? (
        <EmptyState
          title="No flagged products"
          description="All products are clean. Great job!"
          icon={<span className="text-3xl">🛡️</span>}
        />
      ) : (
        <div className="space-y-3">
          {flaggedProducts.map((product) => (
            <div
              key={product._id}
              className="rounded-lg border border-border bg-white p-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 rounded-md bg-neutral-100" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{product.name}</p>
                      <p className="text-sm text-primary-600">₱{product.price.toLocaleString()}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Flagged</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => handleModerate(product._id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-warning"
                  onClick={() => handleModerate(product._id, "warn")}
                >
                  Warn Seller
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-error hover:bg-red-50"
                  onClick={() => handleModerate(product._id, "remove")}
                >
                  Remove + Strike
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
