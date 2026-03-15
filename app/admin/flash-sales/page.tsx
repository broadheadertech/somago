// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminFlashSalesPage() {
  return (
    <AuthGuard message="Please sign in to manage flash sales." requiredRole="admin">
      <AdminFlashSalesContent />
    </AuthGuard>
  );
}

function AdminFlashSalesContent() {
  const flashSales = useQuery(api.flashSales.listAll);
  const products = useQuery(api.products.list, { limit: 200 });
  const createFlashSale = useMutation(api.flashSales.create);
  const toggleActive = useMutation(api.flashSales.toggleActive);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    salePrice: "",
    startDate: "",
    endDate: "",
    stockLimit: "",
  });

  if (flashSales === undefined || products === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleCreate = async () => {
    if (!form.productId || !form.salePrice || !form.startDate || !form.endDate) {
      toast.error("Product, sale price, start date, and end date are required");
      return;
    }

    const startAt = new Date(form.startDate).getTime();
    const endAt = new Date(form.endDate).getTime();

    if (isNaN(startAt) || isNaN(endAt)) {
      toast.error("Invalid date format");
      return;
    }

    if (startAt >= endAt) {
      toast.error("End date must be after start date");
      return;
    }

    if (endAt <= Date.now()) {
      toast.error("End date must be in the future");
      return;
    }

    try {
      await createFlashSale({
        productId: form.productId as any,
        salePrice: Number(form.salePrice),
        startAt,
        endAt,
        stockLimit: form.stockLimit ? Number(form.stockLimit) : undefined,
      });
      toast.success("Flash sale created!");
      setShowForm(false);
      setForm({ productId: "", salePrice: "", startDate: "", endDate: "", stockLimit: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create flash sale");
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Flash Sales ({flashSales.length})</h1>
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Create Flash Sale"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">New Flash Sale</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-700">Product *</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₱{p.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Sale Price (₱) *</label>
              <Input
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="99"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Stock Limit</label>
              <Input
                type="number"
                value={form.stockLimit}
                onChange={(e) => setForm({ ...form, stockLimit: e.target.value })}
                placeholder="100 (optional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Start Date *</label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">End Date *</label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleCreate}>
            Create Flash Sale
          </Button>
        </div>
      )}

      {/* Flash Sales List */}
      {flashSales.length === 0 ? (
        <EmptyState
          title="No flash sales yet"
          description="Create your first flash sale to offer limited-time discounts."
          icon={<span className="text-3xl">⚡</span>}
        />
      ) : (
        <div className="space-y-2">
          {flashSales.map((sale) => {
            const isCurrentlyActive = sale.isActive && now >= sale.startAt && now <= sale.endAt;
            const isExpired = now > sale.endAt;
            const isUpcoming = now < sale.startAt;
            const isSoldOut = sale.stockLimit !== undefined && sale.soldCount >= sale.stockLimit;
            const discountPercent =
              sale.originalPrice > 0
                ? Math.round(((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100)
                : 0;

            return (
              <div
                key={sale._id}
                className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-neutral-900">
                      {sale.product?.name ?? "Unknown Product"}
                    </span>
                    {isCurrentlyActive && !isSoldOut ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : isExpired ? (
                      <Badge className="bg-neutral-100 text-neutral-800">Expired</Badge>
                    ) : isSoldOut ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Sold Out</Badge>
                    ) : isUpcoming ? (
                      <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                    ) : !sale.isActive ? (
                      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                    ) : (
                      <Badge className="bg-neutral-100 text-neutral-800">Inactive</Badge>
                    )}
                    <Badge className="bg-primary-100 text-primary-800">-{discountPercent}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    ₱{sale.originalPrice.toLocaleString()} → ₱{sale.salePrice.toLocaleString()}
                    {" · "}
                    {new Date(sale.startAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {new Date(sale.endAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {sale.stockLimit !== undefined
                      ? ` · ${sale.soldCount}/${sale.stockLimit} sold`
                      : ` · ${sale.soldCount} sold`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await toggleActive({ flashSaleId: sale._id });
                      toast.success(sale.isActive ? "Flash sale deactivated" : "Flash sale activated");
                    } catch (e: any) {
                      toast.error(e.message || "Failed to toggle flash sale");
                    }
                  }}
                >
                  {sale.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
