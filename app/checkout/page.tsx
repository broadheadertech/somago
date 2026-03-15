// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/somago/auth-guard";
import { calculateShippingFee, formatZoneName } from "@/lib/shipping";
import { calculateTax } from "@/lib/tax";

const PAYMENT_METHODS = [
  { id: "cod" as const, label: "Cash on Delivery", icon: "💵", description: "Pay when you receive" },
  { id: "gcash" as const, label: "GCash", icon: "📱", description: "Pay via GCash e-wallet" },
  { id: "maya" as const, label: "Maya", icon: "💳", description: "Pay via Maya e-wallet" },
  { id: "card" as const, label: "Credit / Debit Card", icon: "💳", description: "Visa, Mastercard" },
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
  const applyVoucher = useMutation(api.vouchers.apply);

  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<"cod" | "gcash" | "maya" | "card" | "balance">("cod");
  const [isPlacing, setIsPlacing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState("");

  if (cartItems === undefined || me === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-3 h-32 w-full rounded-lg" />
        <Skeleton className="mb-3 h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Sign in required</h1>
        <p className="mt-2 text-neutral-500">Please sign in to proceed with checkout.</p>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    router.push("/cart");
    return null;
  }

  const defaultAddress = me.addresses?.find((a: any) => a.isDefault) || me.addresses?.[0];
  const total = cartItems.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );

  const firstSellerId = cartItems?.[0]?.product?.sellerId;
  const voucherValidation = useQuery(
    api.vouchers.validate,
    voucherApplied && appliedCode
      ? { code: appliedCode, orderAmount: total, sellerId: firstSellerId as any }
      : "skip"
  );
  const discount = voucherValidation?.valid ? voucherValidation.discount : 0;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = defaultAddress
    ? calculateShippingFee(defaultAddress.province || defaultAddress.city, total, itemCount)
    : null;
  const shippingFee = shipping?.fee ?? 0;
  const tax = calculateTax(total); // Tax on subtotal before discount
  const finalTotal = Math.max(0, total - discount + shippingFee + tax.taxAmount);

  // Group items by seller
  const itemsBySeller = cartItems.reduce(
    (acc, item) => {
      const sellerId = item.product?.sellerId;
      if (!sellerId) return acc;
      if (!acc[sellerId]) acc[sellerId] = [];
      acc[sellerId].push(item);
      return acc;
    },
    {} as Record<string, typeof cartItems>
  );

  const handlePlaceOrder = async () => {
    if (!defaultAddress) {
      toast.error("Please add a delivery address in your account settings.");
      return;
    }

    setIsPlacing(true);
    try {
      // Create one order per seller
      let lastOrderId: string | null = null;
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        lastOrderId = await createOrder({
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
          voucherId: voucherApplied && voucherValidation?.valid
            ? voucherValidation.voucherId as any
            : undefined,
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
    <div className="mx-auto max-w-2xl px-4 py-4 pb-32">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Checkout</h1>

      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-2">
        {["Address", "Payment", "Confirm"].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                step > i ? "bg-primary-500" : step === i + 1 ? "bg-primary-300" : "bg-neutral-200"
              }`}
            />
            <span className={`text-xs ${step >= i + 1 ? "text-primary-600 font-medium" : "text-neutral-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Delivery Address</h2>
          {defaultAddress ? (
            <div className="rounded-lg border-2 border-primary-500 bg-primary-50 p-4">
              <p className="font-medium text-neutral-900">{defaultAddress.fullName}</p>
              <p className="text-sm text-neutral-700">{defaultAddress.phone}</p>
              <p className="text-sm text-neutral-700">
                {defaultAddress.addressLine1}
                {defaultAddress.addressLine2 && `, ${defaultAddress.addressLine2}`}
              </p>
              <p className="text-sm text-neutral-700">
                {defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}
              </p>
              <Badge className="mt-2 bg-primary-100 text-primary-700">Default</Badge>
            </div>
          ) : (
            <div className="rounded-lg border border-warning bg-yellow-50 p-4 text-center">
              <p className="text-sm text-neutral-700">No delivery address found.</p>
              <p className="text-xs text-neutral-500">
                Please add an address in your Account settings.
              </p>
            </div>
          )}
          <Button
            className="w-full bg-primary-600 hover:bg-primary-700"
            onClick={() => setStep(2)}
            disabled={!defaultAddress}
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {/* Step 2: Payment Method */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Payment Method</h2>
          <div className="space-y-2">
            {/* Somago Balance Option — only if covers full order */}
            {me && (me.balance ?? 0) >= finalTotal && finalTotal > 0 && (
              <button
                onClick={() => setSelectedPayment("balance")}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  selectedPayment === "balance"
                    ? "border-primary-500 bg-primary-50"
                    : "border-border hover:border-primary-300"
                }`}
              >
                <span className="text-2xl">
                  <svg className="h-7 w-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">Somago Balance</p>
                  <p className="text-xs text-neutral-500">
                    Available: ₱{(me.balance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-medium text-primary-600">Covers full order</p>
                </div>
                {selectedPayment === "balance" && (
                  <svg className="ml-auto h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}

            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  selectedPayment === pm.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-border hover:border-primary-300"
                }`}
              >
                <span className="text-2xl">{pm.icon}</span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{pm.label}</p>
                  <p className="text-xs text-neutral-500">{pm.description}</p>
                </div>
                {selectedPayment === pm.id && (
                  <svg className="ml-auto h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1 bg-primary-600 hover:bg-primary-700" onClick={() => setStep(3)}>
              Review Order
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Order Summary</h2>

          {/* Items */}
          <div className="rounded-lg border border-border bg-white p-4">
            {cartItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-neutral-900">{item.product?.name}</p>
                  <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-neutral-900">
                  ₱{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <Separator className="my-2" />

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Subtotal</span>
              <span className="text-sm text-neutral-700">₱{total.toLocaleString()}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">
                Shipping {shipping ? `(${formatZoneName(shipping.zone)})` : ""}
              </span>
              {shipping?.isFreeShipping ? (
                <span className="text-sm font-medium text-primary-600">FREE</span>
              ) : (
                <span className="text-sm text-neutral-700">₱{shippingFee.toLocaleString()}</span>
              )}
            </div>
            {shipping && !shipping.isFreeShipping && total < 999 && (
              <p className="text-[10px] text-primary-600">
                Add ₱{(999 - total).toLocaleString()} more for free shipping!
              </p>
            )}
            {shipping && (
              <p className="text-[10px] text-neutral-500">
                Estimated delivery: {shipping.estimatedDays} business days
              </p>
            )}

            {/* Tax */}
            {tax.taxAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{tax.taxLabel}</span>
                <span className="text-sm text-neutral-700">₱{tax.taxAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Voucher Discount */}
            {discount > 0 && (
              <div className="flex items-center justify-between text-primary-600">
                <span className="text-sm">Voucher ({voucherValidation?.description})</span>
                <span className="text-sm font-medium">-₱{discount.toLocaleString()}</span>
              </div>
            )}

            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="text-lg font-bold text-primary-600">
                ₱{finalTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Voucher Code */}
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Voucher Code</p>
            {voucherApplied && voucherValidation?.valid ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary-100 text-primary-700">{appliedCode}</Badge>
                  <span className="text-sm text-primary-600">{voucherValidation.description}</span>
                </div>
                <button
                  onClick={() => { setVoucherApplied(false); setAppliedCode(""); setVoucherCode(""); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="flex-1 uppercase"
                />
                <Button
                  variant="outline"
                  disabled={voucherCode.length < 3}
                  onClick={() => {
                    setAppliedCode(voucherCode.trim());
                    setVoucherApplied(true);
                  }}
                >
                  Apply
                </Button>
              </div>
            )}
            {voucherApplied && voucherValidation && !voucherValidation.valid && (
              <p className="mt-2 text-xs text-red-500">{voucherValidation.error}</p>
            )}
          </div>

          {/* Address Summary */}
          {defaultAddress && (
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="mb-1 text-xs font-medium uppercase text-neutral-500">Deliver to</p>
              <p className="text-sm text-neutral-900">
                {defaultAddress.fullName} — {defaultAddress.addressLine1}, {defaultAddress.city}
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="mb-1 text-xs font-medium uppercase text-neutral-500">Payment</p>
            <p className="text-sm text-neutral-900">
              {selectedPayment === "balance"
                ? `Somago Balance (₱${(me?.balance ?? 0).toLocaleString()})`
                : PAYMENT_METHODS.find((pm) => pm.id === selectedPayment)?.label}
            </p>
          </div>

          {/* Buyer Protection */}
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 p-3">
            <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm text-primary-700">Somago Buyer Protection</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
            >
              {isPlacing ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
