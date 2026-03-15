// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { ProductGridSkeleton } from "@/components/somago/product-card-skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function WishlistPage() {
  return (
    <AuthGuard message="Please sign in to view your wishlist.">
      <WishlistPageContent />
    </AuthGuard>
  );
}

function WishlistPageContent() {
  const wishlist = useQuery(api.wishlist.list);
  const toggleWishlist = useMutation(api.wishlist.toggle);

  if (wishlist === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold text-neutral-900">My Wishlist</h1>
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">
        My Wishlist ({wishlist.length})
      </h1>

      {wishlist.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save products you love and buy them later."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          action={
            <Link href="/">
              <Button className="bg-primary-600 hover:bg-primary-700">Browse Products</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {wishlist.map((item) => (
            <div key={item._id} className="relative">
              <button
                onClick={() => toggleWishlist({ productId: item.productId })}
                className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 shadow-md transition-colors hover:bg-red-50"
              >
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <ProductCard
                id={item.product._id}
                name={item.product.name}
                price={item.product.price}
                originalPrice={item.product.originalPrice}
                imageUrl={item.product.imageUrl ?? null}
                rating={item.product.rating}
                reviewCount={item.product.reviewCount}
                soldCount={item.product.soldCount}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
