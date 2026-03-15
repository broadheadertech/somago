// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  return (
    <AuthGuard message="Please sign in to view your orders.">
      <OrdersPageContent />
    </AuthGuard>
  );
}

function OrdersPageContent() {
  const orders = useQuery(api.orders.listMyOrders);
  const [activeTab, setActiveTab] = useState("all");

  if (orders === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-neutral-900">My Orders</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.orderStatus === activeTab);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">My Orders</h1>

      {/* Status Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? orders.length
              : orders.filter((o) => o.orderStatus === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title={activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
          description={
            activeTab === "all"
              ? "Start shopping and your orders will appear here."
              : `You don't have any ${activeTab} orders.`
          }
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          action={
            activeTab === "all" ? (
              <Link href="/">
                <Button className="bg-primary-600 hover:bg-primary-700">Browse Products</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="block rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-neutral-500">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[order.orderStatus] ?? "bg-neutral-100"}>
                  {order.orderStatus}
                </Badge>
              </div>

              <div className="mt-2 space-y-1">
                {order.items.slice(0, 2).map((item, i) => (
                  <p key={i} className="text-sm text-neutral-700">
                    {item.productName} x{item.quantity}
                  </p>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-neutral-500">
                    +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-bold text-primary-600">
                  ₱{order.totalAmount.toLocaleString()}
                </span>
                <span className="text-xs text-primary-600">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
