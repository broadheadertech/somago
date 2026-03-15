// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { AuthGuard } from "@/components/somago/auth-guard";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "packed",
  packed: "shipped",
};

const ACTION_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Mark as Packed",
  packed: "Ship Order",
};

export default function SellerOrdersPage() {
  return (
    <AuthGuard message="Please sign in to manage your orders." requiredRole="seller">
      <SellerOrdersPageContent />
    </AuthGuard>
  );
}

function SellerOrdersPageContent() {
  const orders = useQuery(api.orders.listSellerOrders, {});
  const updateStatus = useMutation(api.orders.updateStatus);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});

  if (orders === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleAction = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    try {
      await updateStatus({
        orderId: orderId as any,
        status: nextStatus as any,
        trackingNumber: currentStatus === "packed" ? trackingInput[orderId] : undefined,
      });
      toast.success(`Order ${nextStatus}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    }
  };

  const tabs = ["all", "pending", "confirmed", "packed", "shipped", "delivered"];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Orders</h1>

      <Tabs defaultValue="all">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => {
            const count = tab === "all" ? orders.length : orders.filter((o) => o.orderStatus === tab).length;
            return (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab} {count > 0 && <span className="ml-1 text-xs">({count})</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const filtered = tab === "all" ? orders : orders.filter((o) => o.orderStatus === tab);

          return (
            <TabsContent key={tab} value={tab}>
              {filtered.length === 0 ? (
                <EmptyState
                  title={`No ${tab === "all" ? "" : tab + " "}orders`}
                  description="Orders will appear here when buyers purchase your products."
                  icon={<span className="text-3xl">📋</span>}
                />
              ) : (
                <div className="space-y-3">
                  {filtered.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-lg border border-border bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-xs text-neutral-500">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(order.createdAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[order.orderStatus] ?? ""}>
                          {order.orderStatus}
                        </Badge>
                      </div>

                      <div className="mt-2 space-y-1">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-sm text-neutral-700">
                            {item.productName} x{item.quantity} — ₱{(item.unitPrice * item.quantity).toLocaleString()}
                          </p>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                        <div>
                          <p className="text-xs text-neutral-500">
                            Ship to: {order.shippingAddress.city}, {order.shippingAddress.province}
                          </p>
                          <p className="text-sm font-bold text-primary-600">
                            Total: ₱{order.totalAmount.toLocaleString()}
                          </p>
                        </div>

                        {NEXT_STATUS[order.orderStatus] && (
                          <div className="flex items-center gap-2">
                            {order.orderStatus === "packed" && (
                              <Input
                                placeholder="Tracking #"
                                className="w-28 text-xs"
                                value={trackingInput[order._id] ?? ""}
                                onChange={(e) =>
                                  setTrackingInput({
                                    ...trackingInput,
                                    [order._id]: e.target.value,
                                  })
                                }
                              />
                            )}
                            <Button
                              size="sm"
                              className="bg-primary-600 hover:bg-primary-700"
                              onClick={() => handleAction(order._id, order.orderStatus)}
                            >
                              {ACTION_LABELS[order.orderStatus]}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
