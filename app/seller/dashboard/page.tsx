// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function SellerDashboardPage() {
  return (
    <AuthGuard message="Please sign in to access the Seller Dashboard." requiredRole="seller">
      <SellerDashboardPageContent />
    </AuthGuard>
  );
}

function SellerDashboardPageContent() {
  const me = useQuery(api.users.getMe);
  const orders = useQuery(api.orders.listSellerOrders, {});
  const products = useQuery(api.products.listMyProducts);

  if (me === undefined || orders === undefined || products === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const pendingOrders = orders?.filter((o) => o.orderStatus === "pending") ?? [];
  const todayRevenue = orders
    ?.filter((o) => {
      const today = new Date();
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.toDateString() === today.toDateString() &&
        o.orderStatus !== "cancelled"
      );
    })
    .reduce((sum, o) => sum + o.totalAmount, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          {getGreeting()}, {me?.shopProfile?.shopName || me?.name || "Seller"}!
        </h1>
        <p className="text-sm text-neutral-500">Here&apos;s your shop overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Today&apos;s Sales</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">
            ₱{todayRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Pending Orders</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{pendingOrders.length}</p>
          {pendingOrders.length > 0 && (
            <p className="text-xs text-warning">Action needed</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Products Listed</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {products?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {(() => {
        const threshold = me?.lowStockThreshold ?? 5;
        const lowStockProducts = products?.filter((p: any) => p.stock <= threshold && p.status !== "removed") ?? [];
        if (lowStockProducts.length === 0) return null;
        return (
          <div className="rounded-lg border border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 border-b border-orange-200 p-4">
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-sm font-semibold text-orange-900">
                Low Stock Alerts ({lowStockProducts.length})
              </h2>
            </div>
            <div className="divide-y divide-orange-100">
              {lowStockProducts.slice(0, 5).map((product: any) => (
                <div key={product._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">
                      {product.name}
                    </p>
                    <p className="text-xs text-orange-700">
                      {product.stock === 0 ? "Out of stock" : `Only ${product.stock} left`}
                    </p>
                  </div>
                  <Badge className={product.stock === 0 ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                    {product.stock} in stock
                  </Badge>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 5 && (
              <div className="border-t border-orange-200 p-3 text-center">
                <Link href="/seller/products" className="text-xs text-orange-600 hover:underline">
                  View all {lowStockProducts.length} low-stock products
                </Link>
              </div>
            )}
          </div>
        );
      })()}

      {/* Recent Orders */}
      <div className="rounded-lg border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Recent Orders</h2>
          <Link href="/seller/orders" className="text-xs text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        {orders && orders.length > 0 ? (
          <div className="divide-y divide-border">
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    ₱{order.totalAmount.toLocaleString()}
                  </span>
                  <Badge
                    className={
                      order.orderStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.orderStatus === "delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                    }
                  >
                    {order.orderStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-neutral-500">
            No orders yet. Share your shop to get your first sale!
          </p>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
