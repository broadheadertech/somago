// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";
import { LocaleSwitcherInline } from "@/components/somago/locale-switcher";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Id } from "@/convex/_generated/dataModel";

export default function AccountPage() {
  return (
    <AuthGuard message="Please sign in to view your account.">
      <AccountPageContent />
    </AuthGuard>
  );
}

function AccountPageContent() {
  const { isSignedIn, signOut } = useAuth();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const me = useQuery(api.users.getMe);
  const priceAlerts = useQuery(api.priceAlerts.getMyAlerts);
  const deleteAlert = useMutation(api.priceAlerts.deleteAlert);
  const addAddress = useMutation(api.users.addAddress);
  const deleteAddress = useMutation(api.users.deleteAddress);
  const ensureReferralCode = useMutation(api.referrals.ensureReferralCode);
  const referralStats = useQuery(api.referrals.getMyReferralStats);
  const myReferrals = useQuery(api.referrals.getMyReferrals);
  const loyaltyPoints = useQuery(api.loyalty.getMyPoints);
  const redeemPoints = useMutation(api.loyalty.redeemPoints);
  const pointHistory = useQuery(api.loyalty.getHistory);
  const setLowStockThreshold = useMutation(api.users.setLowStockThreshold);
  const updateChatAutoReply = useMutation(api.users.updateChatAutoReply);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean | null>(null);
  const [autoReplyMessage, setAutoReplyMessage] = useState("");
  const [isSavingAutoReply, setIsSavingAutoReply] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", province: "", postalCode: "", isDefault: false,
  });

  if (me === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-4">
        <Skeleton className="mb-4 h-20 w-full rounded-lg" />
        <Skeleton className="mb-3 h-12 w-full rounded-lg" />
        <Skeleton className="mb-3 h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  const defaultAddress = me?.addresses?.find((a: any) => a.isDefault);

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* Profile Header */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-white p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
          {me?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-900">{me?.name || "User"}</h1>
          <p className="text-sm text-neutral-500">{me?.email}</p>
          {me?.role && (
            <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 capitalize">
              {me.role}
            </span>
          )}
        </div>
      </div>

      {/* Somago Balance */}
      <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase text-neutral-500">{t("account.balance")}</p>
            <p className="text-xl font-bold text-primary-700">
              {format(me?.balance ?? 0)}
            </p>
            <p className="text-xs text-neutral-500">{t("account.balanceDesc")}</p>
          </div>
        </div>
      </div>

      {/* Loyalty Points */}
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">P</text>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase text-neutral-500">Loyalty Points</p>
            <p className="text-xl font-bold text-amber-700">
              {loyaltyPoints ?? 0} pts
            </p>
            <p className="text-xs text-neutral-500">Earn 1 point per ₱10 spent</p>
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={(loyaltyPoints ?? 0) < 100}
            onClick={async () => {
              try {
                const result = await redeemPoints({ points: Math.floor((loyaltyPoints ?? 0) / 100) * 100 });
                toast.success(`Redeemed ${result.pointsRedeemed} points for ₱${result.balanceAdded} balance!`);
              } catch (e: any) {
                toast.error(e.message || "Failed to redeem points");
              }
            }}
          >
            Redeem
          </Button>
        </div>
        {(loyaltyPoints ?? 0) < 100 && (
          <p className="mt-2 text-xs text-amber-600">Earn {100 - (loyaltyPoints ?? 0)} more points to redeem (100 pts = ₱10)</p>
        )}
      </div>

      {/* Refer & Earn */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Refer & Earn</p>
            <p className="text-xs text-blue-700">₱50 for you and your friend on their first order</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 font-mono text-sm text-blue-900">
            {referralCode || me?.referralCode || "Loading..."}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={async () => {
              try {
                const code = await ensureReferralCode();
                setReferralCode(code);
                await navigator.clipboard.writeText(`somago.com/sign-up?ref=${code}`);
                toast.success("Referral link copied!");
              } catch {
                toast.error("Failed to copy");
              }
            }}
          >
            Copy Link
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-blue-700">
          <span>{referralStats?.count ?? 0} referred</span>
          <span>₱{referralStats?.earned ?? 0} earned</span>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        <Link
          href="/orders"
          className="flex items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-neutral-50"
        >
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium text-neutral-900">{t("orders.myOrders")}</span>
          </div>
          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Delivery Addresses */}
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-neutral-900">{t("account.addresses")}</span>
            </div>
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-xs font-medium text-primary-600 hover:underline"
            >
              + {t("account.addAddress")}
            </button>
          </div>

          {me?.addresses && me.addresses.length > 0 ? (
            <div className="mt-3 space-y-2">
              {me.addresses.map((addr, i) => (
                <div key={i} className="flex items-start justify-between rounded-md bg-neutral-50 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-neutral-900">{addr.fullName}</p>
                      {addr.isDefault && (
                        <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">{t("account.default")}</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{addr.phone}</p>
                    <p className="text-xs text-neutral-500">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}, {addr.province} {addr.postalCode}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await deleteAddress({ index: i });
                        toast.success("Address removed");
                      } catch (e) {
                        toast.error("Failed to remove address");
                      }
                    }}
                    className="text-xs text-neutral-400 hover:text-red-500"
                  >
                    {t("account.remove")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">{t("account.noAddresses")}</p>
          )}
        </div>

        {/* Add Address Form */}
        {showAddressForm && (
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">{t("account.addNewAddress")}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Full Name *" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} className="rounded-md border border-border px-3 py-2 text-sm" />
                <input placeholder="Phone *" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <input placeholder="Address Line 1 *" value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <input placeholder="Address Line 2 (optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="City *" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="rounded-md border border-border px-3 py-2 text-sm" />
                <input placeholder="Province *" value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} className="rounded-md border border-border px-3 py-2 text-sm" />
                <input placeholder="Postal Code *" value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded border-neutral-300" />
                <span className="text-xs text-neutral-700">{t("account.setDefault")}</span>
              </label>
              <div className="flex gap-2">
                <Button
                  className="bg-primary-600 hover:bg-primary-700"
                  size="sm"
                  disabled={!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.province || !addressForm.postalCode}
                  onClick={async () => {
                    try {
                      await addAddress({
                        label: "Home",
                        fullName: addressForm.fullName,
                        phone: addressForm.phone,
                        addressLine1: addressForm.addressLine1,
                        addressLine2: addressForm.addressLine2 || undefined,
                        city: addressForm.city,
                        province: addressForm.province,
                        postalCode: addressForm.postalCode,
                        isDefault: addressForm.isDefault,
                      });
                      toast.success("Address added!");
                      setShowAddressForm(false);
                      setAddressForm({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", province: "", postalCode: "", isDefault: false });
                    } catch (e) {
                      toast.error("Failed to add address");
                    }
                  }}
                >
                  {t("account.saveAddress")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddressForm(false)}>
                  {t("account.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Price Alerts */}
        {priceAlerts && priceAlerts.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="h-5 w-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm font-medium text-neutral-900">Price Alerts</span>
            </div>
            <div className="space-y-2">
              {priceAlerts.map((alert) => (
                <div key={alert._id} className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <Link href={`/product/${alert.productId}`} className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">{alert.productName}</p>
                    <p className="text-xs text-neutral-500">
                      Target: ₱{alert.targetPrice.toLocaleString()} | Current: ₱{alert.currentPrice.toLocaleString()}
                    </p>
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await deleteAlert({ alertId: alert._id });
                        toast.success("Alert removed");
                      } catch {
                        toast.error("Failed to remove alert");
                      }
                    }}
                    className="ml-2 text-xs text-neutral-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Language & Currency */}
        <LocaleSwitcherInline />

        {/* Seller Section */}
        {me?.role === "buyer" && (
          <Link
            href="/sell"
            className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4 transition-colors hover:bg-primary-100"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="text-sm font-medium text-primary-700">{t("nav.sellOnSomago")}</span>
            </div>
            <svg className="h-4 w-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {me?.role === "seller" && (
          <>
            <Link
              href="/seller/dashboard"
              className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4 transition-colors hover:bg-primary-100"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-primary-700">{t("nav.sellerDashboard")}</span>
              </div>
              <svg className="h-4 w-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Low Stock Threshold Setting */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-orange-900">Low Stock Alert Threshold</span>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Get notified when product stock falls to this level. Current: {me?.lowStockThreshold ?? 5} units
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={String(me?.lowStockThreshold ?? 5)}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-20 rounded-md border border-orange-200 bg-white px-3 py-1.5 text-sm"
                />
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!thresholdInput || Number(thresholdInput) < 0}
                  onClick={async () => {
                    try {
                      await setLowStockThreshold({ threshold: Number(thresholdInput) });
                      toast.success(`Threshold set to ${thresholdInput} units`);
                      setThresholdInput("");
                    } catch (e: any) {
                      toast.error(e.message || "Failed to update threshold");
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Chat Auto-Reply */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Chat Auto-Reply</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Automatically reply to new messages when you are away.
              </p>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={autoReplyEnabled ?? me?.chatAutoReply?.enabled ?? false}
                  onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                  className="rounded border-blue-300"
                />
                <span className="text-sm text-blue-900">Enable auto-reply</span>
              </label>
              <textarea
                placeholder="Thanks for your message! I'll get back to you soon."
                value={autoReplyMessage || me?.chatAutoReply?.message || "Thanks for your message! I'll get back to you soon."}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm mb-2"
              />
              <p className="text-[10px] text-blue-400 mb-3">
                {(autoReplyMessage || me?.chatAutoReply?.message || "").length}/500 characters
              </p>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSavingAutoReply}
                onClick={async () => {
                  setIsSavingAutoReply(true);
                  try {
                    await updateChatAutoReply({
                      enabled: autoReplyEnabled ?? me?.chatAutoReply?.enabled ?? false,
                      message: autoReplyMessage || me?.chatAutoReply?.message || "Thanks for your message! I'll get back to you soon.",
                    });
                    toast.success("Auto-reply settings saved!");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to save auto-reply");
                  } finally {
                    setIsSavingAutoReply(false);
                  }
                }}
              >
                {isSavingAutoReply ? "Saving..." : "Save Auto-Reply"}
              </Button>
            </div>
          </>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full text-error hover:bg-red-50 hover:text-error"
          onClick={() => signOut()}
        >
          {t("account.signOut")}
        </Button>
      </div>
    </div>
  );
}
