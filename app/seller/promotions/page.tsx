// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useState } from "react";
import { toast } from "sonner";

export default function SellerPromotionsPage() {
  return (
    <AuthGuard message="Please sign in to manage promotions." requiredRole="seller">
      <SellerPromotionsContent />
    </AuthGuard>
  );
}

function SellerPromotionsContent() {
  const promotions = useQuery(api.promotions.getMyPromotions);
  const products = useQuery(api.products.listMyProducts);
  const createPromotion = useMutation(api.promotions.create);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    budget: "",
    costPerClick: "1",
    startAt: "",
    endAt: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.productId || !form.budget || !form.startAt || !form.endAt) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsCreating(true);
    try {
      await createPromotion({
        productId: form.productId as any,
        budget: parseFloat(form.budget),
        costPerClick: parseFloat(form.costPerClick),
        startAt: new Date(form.startAt).getTime(),
        endAt: new Date(form.endAt).getTime(),
      });
      toast.success("Promotion created!");
      setShowForm(false);
      setForm({ productId: "", budget: "", costPerClick: "1", startAt: "", endAt: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create promotion");
    } finally {
      setIsCreating(false);
    }
  };

  if (promotions === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Promoted Listings</h1>
          <p className="text-sm text-neutral-500">Boost your products to reach more buyers</p>
        </div>
        <Button
          className="bg-primary-600 hover:bg-primary-700"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Create Promotion"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">New Promotion</h3>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Product</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a product...</option>
              {products?.filter((p) => p.status === "active").map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} - ₱{p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Budget (₱)</label>
              <Input
                type="number"
                min="50"
                placeholder="Min ₱50"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Cost Per Click (₱)</label>
              <Input
                type="number"
                min="1"
                step="0.5"
                value={form.costPerClick}
                onChange={(e) => setForm({ ...form, costPerClick: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Start Date</label>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">End Date</label>
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={isCreating}
            onClick={handleCreate}
          >
            {isCreating ? "Creating..." : "Create Promotion"}
          </Button>
        </div>
      )}

      <Separator />

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-neutral-500">No promotions yet. Create one to boost your products!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => {
            const ctr = promo.impressions > 0 ? ((promo.clicks / promo.impressions) * 100).toFixed(1) : "0.0";
            const budgetPct = promo.budget > 0 ? ((promo.spent / promo.budget) * 100).toFixed(0) : "0";
            const now = Date.now();
            const isLive = promo.isActive && promo.startAt <= now && promo.endAt >= now;

            return (
              <div key={promo._id} className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate">
                        {promo.productName}
                      </h3>
                      {isLive ? (
                        <Badge className="bg-green-100 text-green-800 shrink-0">Live</Badge>
                      ) : promo.isActive ? (
                        <Badge className="bg-yellow-100 text-yellow-800 shrink-0">Scheduled</Badge>
                      ) : (
                        <Badge className="bg-neutral-100 text-neutral-600 shrink-0">Ended</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(promo.startAt).toLocaleDateString()} - {new Date(promo.endAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-4 gap-3">
                  <div className="rounded-md bg-neutral-50 p-2 text-center">
                    <p className="text-xs text-neutral-500">Impressions</p>
                    <p className="text-sm font-bold text-neutral-900">{promo.impressions.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-neutral-50 p-2 text-center">
                    <p className="text-xs text-neutral-500">Clicks</p>
                    <p className="text-sm font-bold text-neutral-900">{promo.clicks.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md bg-neutral-50 p-2 text-center">
                    <p className="text-xs text-neutral-500">CTR</p>
                    <p className="text-sm font-bold text-neutral-900">{ctr}%</p>
                  </div>
                  <div className="rounded-md bg-neutral-50 p-2 text-center">
                    <p className="text-xs text-neutral-500">Spent</p>
                    <p className="text-sm font-bold text-neutral-900">₱{promo.spent.toLocaleString()}</p>
                  </div>
                </div>

                {/* Budget Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Budget: ₱{promo.spent.toLocaleString()} / ₱{promo.budget.toLocaleString()}</span>
                    <span>{budgetPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${Math.min(100, parseFloat(budgetPct))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
