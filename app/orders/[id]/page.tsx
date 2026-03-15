// @ts-nocheck
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/somago/review-form";
import { ReportIssueForm } from "@/components/somago/report-issue-form";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/somago/auth-guard";
import { TrackingMap } from "@/components/somago/tracking-map";
import { useAuth } from "@clerk/nextjs";

const ORDER_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderDetailPage() {
  return (
    <AuthGuard message="Please sign in to view order details.">
      <OrderDetailPageContent />
    </AuthGuard>
  );
}

function OrderDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery(api.orders.getById, { orderId: id as any });
  const shipment = useQuery(api.shipments.getByOrder, { orderId: id as any });
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const token = await getToken({ template: "convex" });
      const res = await fetch(`/api/invoice/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download invoice");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `somago-invoice-${id?.slice(-8).toUpperCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Order not found</h1>
        <Link href="/orders" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.indexOf(order.orderStatus as any);
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Link href="/orders" className="text-xs text-primary-600 hover:underline">
            ← Back to Orders
          </Link>
          <h1 className="mt-1 text-xl font-bold text-neutral-900">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500">
            {new Date(order.createdAt).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          className={
            isCancelled
              ? "bg-red-100 text-red-800"
              : order.orderStatus === "delivered"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
          }
        >
          {STATUS_LABELS[order.orderStatus]}
        </Badge>
      </div>

      {/* Download Invoice Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="border-primary-500 text-primary-600 hover:bg-primary-50"
          disabled={isDownloading}
          onClick={handleDownloadInvoice}
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isDownloading ? "Downloading..." : "Download Invoice"}
        </Button>
      </div>

      {/* Order Timeline / Tracking Map */}
      {!isCancelled && (
        <>
          {shipment ? (
            <div className="mb-6">
              <TrackingMap
                currentStep={
                  shipment.status === "created" ? 0
                  : shipment.status === "picked_up" ? 1
                  : shipment.status === "in_transit" ? 2
                  : shipment.status === "out_for_delivery" ? 3
                  : shipment.status === "delivered" ? 4
                  : 0
                }
                carrier={shipment.carrier}
                estimatedDelivery={shipment.estimatedDelivery}
                events={shipment.events}
              />
              {shipment.trackingNumber && (
                <div className="mt-2 rounded-lg border border-border bg-white p-3">
                  <p className="text-xs text-neutral-500">Tracking Number</p>
                  <p className="font-mono text-sm text-neutral-900">{shipment.trackingNumber}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Order Progress</h2>
              <div className="flex items-center justify-between">
                {ORDER_STEPS.map((step, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;

                  return (
                    <div key={step} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        {i > 0 && (
                          <div
                            className={`h-0.5 flex-1 ${
                              isCompleted ? "bg-primary-500" : "bg-neutral-200"
                            }`}
                          />
                        )}
                        <div
                          className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                            isCompleted
                              ? "bg-primary-500 text-white"
                              : "border-2 border-neutral-200 bg-white"
                          } ${isCurrent ? "ring-4 ring-primary-100" : ""}`}
                        >
                          {isCompleted && (
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 ${
                              i < currentStepIndex ? "bg-primary-500" : "bg-neutral-200"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`mt-1 text-[10px] ${
                          isCompleted ? "font-medium text-primary-600" : "text-neutral-500"
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {order.trackingNumber && (
                <div className="mt-3 rounded bg-neutral-50 p-2">
                  <p className="text-xs text-neutral-500">Tracking Number</p>
                  <p className="font-mono text-sm text-neutral-900">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Order Items */}
      <div className="mb-4 rounded-lg border border-border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-neutral-900">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-neutral-500">{item.variantLabel}</p>
                  )}
                  <p className="text-xs text-neutral-500">x{item.quantity}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-neutral-900">
                ₱{(item.unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900">Total</span>
          <span className="text-lg font-bold text-primary-600">
            ₱{order.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="mb-4 rounded-lg border border-border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Delivery Address</h2>
        <p className="text-sm text-neutral-700">{order.shippingAddress.fullName}</p>
        <p className="text-sm text-neutral-700">{order.shippingAddress.phone}</p>
        <p className="text-sm text-neutral-700">
          {order.shippingAddress.addressLine1}
          {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
        </p>
        <p className="text-sm text-neutral-700">
          {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
          {order.shippingAddress.postalCode}
        </p>
      </div>

      {/* Payment Info */}
      <div className="mb-4 rounded-lg border border-border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Payment</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-700 capitalize">{order.paymentMethod}</span>
          <Badge
            className={
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-800"
                : order.paymentStatus === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }
          >
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Actions for delivered orders */}
      {order.orderStatus === "delivered" && (
        <div className="space-y-4">
          {/* Review Forms */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Write a Review</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <ReviewForm
                  key={i}
                  productId={item.productId}
                  orderId={order._id}
                  productName={item.productName}
                />
              ))}
            </div>
          </div>

          {/* Report Issue */}
          <ReportIssueForm orderId={order._id} />

          {/* Request Return */}
          <RequestReturnButton orderId={order._id} />
        </div>
      )}

      {/* Cancel Order Button */}
      {(order.orderStatus === "pending" || order.orderStatus === "confirmed") && (
        <CancelOrderButton orderId={order._id} />
      )}

      {/* Reorder Button */}
      {(order.orderStatus === "delivered" || order.orderStatus === "cancelled") && (
        <ReorderButton items={order.items} />
      )}
    </div>
  );
}

function CancelOrderButton({ orderId }: { orderId: any }) {
  const cancelOrder = useMutation(api.orders.cancelOrder);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await cancelOrder({ orderId });
      toast.success("Order cancelled successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Button
      className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
      onClick={handleCancel}
      disabled={isCancelling}
    >
      {isCancelling ? "Cancelling..." : "Cancel Order"}
    </Button>
  );
}

function ReorderButton({ items }: { items: any[] }) {
  const addToCart = useMutation(api.cart.add);
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleReorder = async () => {
    setIsAdding(true);
    try {
      for (const item of items) {
        await addToCart({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
      toast.success("Items added to cart!");
      router.push("/cart");
    } catch (e: any) {
      toast.error(e.message || "Some items may no longer be available");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      className="mt-4 w-full bg-primary-600 hover:bg-primary-700"
      onClick={handleReorder}
      disabled={isAdding}
    >
      {isAdding ? "Adding to cart..." : "Reorder These Items"}
    </Button>
  );
}

function RequestReturnButton({ orderId }: { orderId: any }) {
  const requestReturn = useMutation(api.returns.requestReturn);
  const existingReturn = useQuery(api.returns.getByOrder, { orderId });
  const [isRequesting, setIsRequesting] = useState(false);
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (existingReturn) {
    const statusColors: Record<string, string> = {
      requested: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      shipped_back: "bg-purple-100 text-purple-800",
      received: "bg-indigo-100 text-indigo-800",
      refunded: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <div className="rounded-lg border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Return Request</p>
            <p className="text-xs text-neutral-500">{existingReturn.reason}</p>
            {existingReturn.returnTrackingNumber && (
              <p className="mt-1 text-xs text-neutral-500">
                Return Tracking: <span className="font-mono">{existingReturn.returnTrackingNumber}</span>
              </p>
            )}
          </div>
          <Badge className={statusColors[existingReturn.status] ?? "bg-gray-100 text-gray-800"}>
            {existingReturn.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        variant="outline"
        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
        onClick={() => setShowForm(true)}
      >
        Request Return
      </Button>
    );
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the return.");
      return;
    }
    setIsRequesting(true);
    try {
      await requestReturn({ orderId, reason: reason.trim() });
      toast.success("Return request submitted!");
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to request return");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">Request Return</h3>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you returning this order?"
        className="mb-3 w-full rounded-md border border-border bg-white p-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white"
          onClick={handleSubmit}
          disabled={isRequesting || !reason.trim()}
        >
          {isRequesting ? "Submitting..." : "Submit Return Request"}
        </Button>
      </div>
    </div>
  );
}
