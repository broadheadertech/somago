// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/somago/auth-guard";
import { calculateShippingFee, formatZoneName } from "@/lib/shipping";
import { calculateTax } from "@/lib/tax";

const PAYMENT_METHODS = [
  { id: "cod" as const, label: "Cash on Delivery", icon: "💵" },
  { id: "gcash" as const, label: "GCash", icon: "📱" },
  { id: "maya" as const, label: "Maya", icon: "💳" },
  { id: "card" as const, label: "Credit / Debit Card", icon: "💳" },
];

export default function CheckoutPage() {
  return (
    <AuthGuard message="Please sign in to proceed with checkout.">
      <CheckoutPageContent />
    </AuthGuard>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const cartItems = useQuery(api.cart.get);
  const me = useQuery(api.users.getMe);
  const createOrder = useMutation(api.orders.create);

  const [selectedPayment, setSelectedPayment] = useState<"cod" | "gcash" | "maya" | "card" | "balance">("cod");
  const [isPlacing, setIsPlacing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState("");

  if (cartItems === undefined || me === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-3 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!me || !cartItems || cartItems.length === 0) {
    router.push("/cart");
    return null;
  }

  const defaultAddress = me.addresses?.find((a: any) => a.isDefault) || me.addresses?.[0];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const firstSellerId = cartItems?.[0]?.product?.sellerId;

  const voucherValidation = useQuery(
    api.vouchers.validate,
    voucherApplied && appliedCode
      ? { code: appliedCode, orderAmount: subtotal, sellerId: firstSellerId as any }
      : "skip"
  );
  const discount = voucherValidation?.valid ? voucherValidation.discount : 0;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = defaultAddress
    ? calculateShippingFee(defaultAddress.province || defaultAddress.city, subtotal, itemCount)
    : null;
  const shippingFee = shipping?.fee ?? 0;
  const tax = calculateTax(subtotal);
  const finalTotal = Math.max(0, subtotal - discount + shippingFee + tax.taxAmount);
  const totalSavings = discount + (shipping?.isFreeShipping ? 50 : 0) + (cartItems.reduce((s, i) => {
    const orig = i.product?.originalPrice ?? i.product?.price ?? 0;
    const curr = i.product?.price ?? 0;
    return s + (orig > curr ? (orig - curr) * i.quantity : 0);
  }, 0));

  const handlePlaceOrder = async () => {
    if (!defaultAddress) {
      toast.error("Please add a delivery address first.");
      return;
    }
    setIsPlacing(true);
    try {
      const itemsBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.product?.sellerId;
        if (!sellerId) return acc;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        await createOrder({
          sellerId: sellerId as any,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.product?.name ?? "Product",
            productImage: item.product?.images?.[0],
            quantity: item.quantity,
            unitPrice: item.product?.price ?? 0,
          })),
          shippingAddress: {
            fullName: defaultAddress.fullName,
            phone: defaultAddress.phone,
            addressLine1: defaultAddress.addressLine1,
            addressLine2: defaultAddress.addressLine2,
            city: defaultAddress.city,
            province: defaultAddress.province,
            postalCode: defaultAddress.postalCode,
          },
          paymentMethod: selectedPayment,
          shippingFee: shippingFee > 0 ? shippingFee : undefined,
          voucherDiscount: discount > 0 ? discount : undefined,
          voucherCode: appliedCode || undefined,
          voucherId: voucherApplied && voucherValidation?.valid ? voucherValidation.voucherId as any : undefined,
          tax: tax.taxAmount > 0 ? tax.taxAmount : undefined,
        });
      }
      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 py-3 pb-28 sm:px-4">
      {/* Savings banner */}
      {totalSavings > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2">
          <span className="text-sm">🎉</span>
          <span className="text-xs font-medium text-primary-700">
            You're saving ₱{totalSavings.toLocaleString()} on this order!
          </span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_300px]">
        {/* ── Left Column ─────────────────────────────────────── */}
        <div className="space-y-3">

          {/* Delivery Address */}
          <div className="rounded-lg bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700">📍 Delivery Address</h2>
              <a href="/account" className="text-[11px] text-primary-600 hover:underline">Change</a>
            </div>
            {defaultAddress ? (
              <div>
                <p className="text-sm font-medium text-neutral-900">{defaultAddress.fullName} · {defaultAddress.phone}</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {defaultAddress.addressLine1}{defaultAddress.addressLine2 && `, ${defaultAddress.addressLine2}`}, {defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}
                </p>
                {shipping && (
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Est. delivery: {shipping.estimatedDays} days ({formatZoneName(shipping.zone)})
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded bg-yellow-50 p-3 text-center">
                <p className="text-xs text-neutral-700">No address found</p>
                <a href="/account" className="text-xs font-medium text-primary-600 hover:underline">Add address →</a>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="rounded-lg bg-white p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-700">🛒 Items ({itemCount})</h2>
            <div className="divide-y divide-neutral-100">
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-300 text-lg">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-800 line-clamp-1">{item.product?.name}</p>
                    {item.variant && (
                      <p className="text-[10px] text-neutral-500">{item.variant}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-primary-600">₱{(item.product?.price ?? 0).toLocaleString()}</span>
                      <span className="text-[11px] text-neutral-500">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-lg bg-white p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-700">💳 Payment Method</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* Somago Balance */}
              {me && (me.balance ?? 0) >= finalTotal && finalTotal > 0 && (
                <button
                  onClick={() => setSelectedPayment("balance")}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                    selectedPayment === "balance"
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                      : "border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  <span className="text-lg">💰</span>
                  <span className="text-[10px] font-medium text-neutral-800">Balance</span>
                  <span className="text-[9px] text-primary-600">₱{(me.balance ?? 0).toLocaleString()}</span>
                </button>
              )}
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPayment(pm.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                    selectedPayment === pm.id
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                      : "border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  <span className="text-lg">{pm.icon}</span>
                  <span className="text-[10px] font-medium text-neutral-800 leading-tight">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voucher */}
          <div className="rounded-lg bg-white p-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-700">🎫 Voucher Code</h2>
            {voucherApplied && voucherValidation?.valid ? (
              <div className="flex items-center justify-between rounded bg-primary-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary-100 text-primary-700 text-[10px]">{appliedCode}</Badge>
                  <span className="text-xs text-primary-700">-₱{discount.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { setVoucherApplied(false); setAppliedCode(""); setVoucherCode(""); }}
                  className="text-[10px] text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 text-xs uppercase h-8"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={voucherCode.length < 3}
                  onClick={() => { setAppliedCode(voucherCode.trim()); setVoucherApplied(true); }}
                >
                  Apply
                </Button>
              </div>
            )}
            {voucherApplied && voucherValidation && !voucherValidation.valid && (
              <p className="mt-1 text-[10px] text-red-500">{voucherValidation.error}</p>
            )}
          </div>
        </div>

        {/* ── Right Column: Order Summary (sticky on desktop) ── */}
        <div className="md:sticky md:top-20 md:self-start">
          <div className="rounded-lg bg-white p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-700">Order Summary</h2>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                <span className="text-neutral-800">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                {shipping?.isFreeShipping ? (
                  <span className="font-medium text-emerald-600">FREE</span>
                ) : (
                  <span className="text-neutral-800">₱{shippingFee.toLocaleString()}</span>
                )}
              </div>
              {!shipping?.isFreeShipping && subtotal < 999 && (
                <p className="text-[10px] text-primary-600">Add ₱{(999 - subtotal).toLocaleString()} more for free shipping</p>
              )}
              {tax.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">{tax.taxLabel}</span>
                  <span className="text-neutral-800">₱{tax.taxAmount.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-primary-600">
                  <span>Voucher discount</span>
                  <span className="font-medium">-₱{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="mt-2 border-t border-neutral-100 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 text-sm">Total</span>
                  <span className="text-lg font-bold text-primary-600">₱{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Buyer Protection */}
            <div className="mt-3 flex items-center gap-1.5 rounded bg-neutral-50 px-2 py-1.5">
              <svg className="h-3.5 w-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px] text-neutral-600">Somago Buyer Protection</span>
            </div>

            <Button
              className="mt-3 w-full rounded-lg bg-primary-600 text-sm font-semibold hover:bg-primary-700"
              onClick={handlePlaceOrder}
              disabled={isPlacing || !defaultAddress}
            >
              {isPlacing ? "Placing Order..." : `Place Order · ₱${finalTotal.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
