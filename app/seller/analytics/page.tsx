// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function SellerAnalyticsPage() {
  return (
    <AuthGuard message="Please sign in to view your analytics." requiredRole="seller">
      <SellerAnalyticsPageContent />
    </AuthGuard>
  );
}

function SellerAnalyticsPageContent() {
  const orders = useQuery(api.orders.listSellerOrders, {});
  const products = useQuery(api.products.listMyProducts);

  if (orders === undefined || products === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>
    );
  }

  const completedOrders = orders?.filter((o) => o.orderStatus !== "cancelled") ?? [];
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = totalRevenue * 0.05;
  const netEarnings = totalRevenue - totalCommission;
  const totalSold = completedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Top products by sales
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const order of completedOrders) {
    for (const item of order.items) {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSales[key].qty += item.quantity;
      productSales[key].revenue += item.unitPrice * item.quantity;
    }
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Orders by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const ordersByDay = last7Days.map((day) => ({
    day,
    count: completedOrders.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === day
    ).length,
    revenue: completedOrders
      .filter((o) => new Date(o.createdAt).toISOString().slice(0, 10) === day)
      .reduce((sum, o) => sum + o.totalAmount, 0),
  }));
  const maxRevenue = Math.max(...ordersByDay.map((d) => d.revenue), 1);

  const handleExportCSV = () => {
    const COMMISSION_RATE = 0.05;
    const rows = [["Order ID", "Date", "Product", "Qty", "Amount", "Commission", "Net"]];
    for (const order of completedOrders) {
      for (const item of order.items) {
        const amount = item.unitPrice * item.quantity;
        const commission = amount * COMMISSION_RATE;
        const net = amount - commission;
        rows.push([
          order._id.slice(-8).toUpperCase(),
          new Date(order.createdAt).toLocaleDateString("en-PH"),
          item.productName,
          String(item.quantity),
          amount.toFixed(2),
          commission.toFixed(2),
          net.toFixed(2),
        ]);
      }
    }
    // Escape CSV: double quotes inside values, wrap all in quotes
    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `somago-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Sales Analytics</h1>
        <Button
          variant="outline"
          size="sm"
          className="border-primary-500 text-primary-600 hover:bg-primary-50"
          onClick={handleExportCSV}
          disabled={completedOrders.length === 0}
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">
            ₱{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Net Earnings</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            ₱{netEarnings.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500">After 5% commission</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{completedOrders.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Items Sold</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{totalSold}</p>
        </div>
      </div>

      {/* Revenue Chart (simple bar chart) */}
      <div className="rounded-lg border border-border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Last 7 Days Revenue</h2>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {ordersByDay.map((day) => (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-neutral-500">
                {day.revenue > 0 ? `₱${day.revenue.toLocaleString()}` : ""}
              </span>
              <div
                className="w-full rounded-t bg-primary-400 transition-all"
                style={{
                  height: `${Math.max((day.revenue / maxRevenue) * 80, day.revenue > 0 ? 4 : 0)}px`,
                }}
              />
              <span className="text-[10px] text-neutral-500">
                {new Date(day.day).toLocaleDateString("en-PH", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-lg border border-border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Top Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-neutral-500">No sales data yet</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {i + 1}
                  </span>
                  <span className="text-sm text-neutral-900">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-600">
                    ₱{product.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">{product.qty} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
