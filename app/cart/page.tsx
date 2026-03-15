// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { toast } from "sonner";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function CartPage() {
  return (
    <AuthGuard message="Please sign in to view your shopping cart.">
      <CartPageContent />
    </AuthGuard>
  );
}

function CartPageContent() {
  const cartItems = useQuery(api.cart.get);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.remove);

  if (cartItems === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-neutral-900">Shopping Cart</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3 flex gap-3 rounded-lg border border-border p-3">
            <Skeleton className="h-20 w-20 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-neutral-900">Shopping Cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Browse products and add them to your cart."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          }
          action={
            <Link href="/">
              <Button className="bg-primary-600 hover:bg-primary-700">Browse Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum: number, item: any) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );

  const handleQuantityChange = async (cartItemId: string, newQty: number) => {
    try {
      await updateQuantity({ cartItemId: cartItemId as any, quantity: newQty });
    } catch (e: any) {
      toast.error(e.message || "Failed to update quantity");
    }
  };

  const handleRemove = async (cartItemId: string) => {
    try {
      await removeItem({ cartItemId: cartItemId as any });
      toast.success("Item removed from cart");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove item");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-32">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">
        Shopping Cart ({cartItems.length})
      </h1>

      <div className="space-y-3">
        {cartItems.map((item) => (
          <div
            key={item._id}
            className="flex gap-3 rounded-lg border border-border bg-white p-3"
          >
            {/* Product Image */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
              {item.product?.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-300">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/product/${item.productId}`}
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600"
                >
                  {item.product?.name ?? "Product"}
                </Link>
                {item.variantIndex !== undefined && item.product?.variants && (
                  <p className="text-xs text-neutral-500">
                    {item.product.variants
                      .map((v: any) => v.options?.[item.variantIndex]?.label)
                      .filter(Boolean)
                      .join(" / ") || `Option ${item.variantIndex + 1}`}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-primary-600">
                  ₱{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                </span>

                <div className="flex items-center gap-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center rounded border border-border">
                    <button
                      onClick={() =>
                        item.quantity <= 1
                          ? handleRemove(item._id)
                          : handleQuantityChange(item._id, item.quantity - 1)
                      }
                      className="px-2 py-0.5 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {item.quantity <= 1 ? (
                        <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ) : "-"}
                    </button>
                    <span className="min-w-[1.5rem] text-center text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item._id, item.quantity + 1)
                      }
                      className="px-2 py-0.5 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="text-xs text-neutral-500 hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-white p-4 md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Total</p>
            <p className="text-xl font-bold text-primary-600">
              ₱{total.toLocaleString()}
            </p>
          </div>
          <Link href="/checkout">
            <Button className="bg-primary-600 px-8 hover:bg-primary-700">
              Checkout ({cartItems.length})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
