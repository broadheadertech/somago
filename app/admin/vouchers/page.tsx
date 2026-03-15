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

export default function AdminVouchersPage() {
  return (
    <AuthGuard message="Please sign in to manage vouchers." requiredRole="admin">
      <AdminVouchersContent />
    </AuthGuard>
  );
}

function AdminVouchersContent() {
  const vouchers = useQuery(api.vouchers.listAll);
  const createVoucher = useMutation(api.vouchers.create);
  const toggleActive = useMutation(api.vouchers.toggleActive);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "fixed" as "fixed" | "percentage",
    value: "",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "",
    expiresInDays: "",
  });

  if (vouchers === undefined) {
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
    if (!form.code || !form.value) {
      toast.error("Code and value are required");
      return;
    }
    try {
      await createVoucher({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresInDays
          ? Date.now() + Number(form.expiresInDays) * 24 * 60 * 60 * 1000
          : undefined,
      });
      toast.success("Voucher created!");
      setShowForm(false);
      setForm({ code: "", type: "fixed", value: "", minOrderAmount: "", maxDiscount: "", usageLimit: "", expiresInDays: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create voucher");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Vouchers ({vouchers.length})</h1>
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Create Voucher"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">New Platform Voucher</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Code *</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME50" className="uppercase" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="fixed">Fixed (₱ off)</option>
                <option value="percentage">Percentage (% off)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                {form.type === "fixed" ? "Amount (₱) *" : "Percentage (%) *"}
              </label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "fixed" ? "50" : "10"} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Min Order (₱)</label>
              <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="500" />
            </div>
            {form.type === "percentage" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">Max Discount (₱)</label>
                <Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="200" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Usage Limit</label>
              <Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">Expires in (days)</label>
              <Input type="number" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} placeholder="30" />
            </div>
          </div>
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleCreate}>
            Create Voucher
          </Button>
        </div>
      )}

      {/* Voucher List */}
      {vouchers.length === 0 ? (
        <EmptyState title="No vouchers yet" description="Create your first platform voucher." icon={<span className="text-3xl">🎟</span>} />
      ) : (
        <div className="space-y-2">
          {vouchers.map((v) => {
            const isExpired = v.expiresAt && v.expiresAt < Date.now();
            const isMaxed = v.usageLimit && v.usedCount >= v.usageLimit;
            return (
              <div key={v._id} className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-neutral-900">{v.code}</span>
                    {v.isActive && !isExpired && !isMaxed ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : isExpired ? (
                      <Badge className="bg-neutral-100 text-neutral-800">Expired</Badge>
                    ) : isMaxed ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Fully Used</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                    )}
                    {v.sellerId && <Badge className="bg-blue-100 text-blue-800">Seller</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {v.type === "fixed" ? `₱${v.value} off` : `${v.value}% off`}
                    {v.minOrderAmount ? ` · Min ₱${v.minOrderAmount}` : ""}
                    {v.maxDiscount ? ` · Max ₱${v.maxDiscount}` : ""}
                    {` · Used ${v.usedCount}${v.usageLimit ? `/${v.usageLimit}` : ""}`}
                    {v.expiresAt ? ` · Expires ${new Date(v.expiresAt).toLocaleDateString("en-PH")}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await toggleActive({ voucherId: v._id });
                    toast.success(v.isActive ? "Voucher deactivated" : "Voucher activated");
                  }}
                >
                  {v.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
