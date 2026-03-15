// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Basic",
    price: 0,
    commission: "5%",
    features: ["Unlimited product listings", "Basic analytics", "Standard support", "5% commission per sale"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    commission: "3%",
    popular: true,
    features: [
      "Everything in Basic",
      "3% commission per sale",
      "Priority support",
      "Advanced analytics",
      "Promoted listings credits",
      "Mall application eligible",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 4999,
    commission: "2%",
    features: [
      "Everything in Premium",
      "2% commission per sale",
      "Dedicated account manager",
      "API access",
      "Custom storefront",
      "Priority Mall approval",
      "Bulk import tools",
    ],
  },
];

export default function SubscriptionPage() {
  const subscription = useQuery(api.subscriptions.getMySubscription);
  const subscribe = useMutation(api.subscriptions.subscribe);
  const cancel = useMutation(api.subscriptions.cancelSubscription);
  const [loading, setLoading] = useState<string | null>(null);

  if (subscription === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    try {
      await subscribe({ plan: plan as any });
      toast.success(`Subscribed to ${plan} plan!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to subscribe");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      toast.success("Subscription cancelled. You're now on the Basic plan.");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Subscription Plans</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose a plan that fits your business. Upgrade anytime to lower your commission rate.
        </p>
      </div>

      {/* Current plan banner */}
      {currentPlan !== "free" && subscription?.expiresAt && (
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
          <div>
            <span className="text-sm font-medium text-primary-800">
              Current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
            <span className="ml-2 text-xs text-primary-600">
              Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50">
            Cancel Plan
          </Button>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border-2 p-5 transition-shadow ${
                plan.popular
                  ? "border-primary-500 shadow-md"
                  : isCurrent
                    ? "border-primary-300 bg-primary-50/50"
                    : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px]">
                  Most Popular
                </Badge>
              )}

              <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                {plan.price > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-primary-600">₱{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-neutral-500">/month</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-neutral-900">Free</span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-primary-700">{plan.commission} commission</p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <Button disabled className="w-full">Current Plan</Button>
                ) : (
                  <Button
                    className={`w-full ${plan.popular ? "bg-primary-600 hover:bg-primary-700" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? "Processing..." : plan.price > 0 ? "Subscribe" : "Downgrade"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <PaymentHistory />
    </div>
  );
}

function PaymentHistory() {
  const payments = useQuery(api.subscriptions.listPayments);

  if (!payments || payments.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Payment History</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Plan</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-4 py-2">{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 capitalize">{payment.plan}</td>
                <td className="px-4 py-2 text-right font-medium">₱{payment.amount.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Badge variant={payment.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {payment.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
