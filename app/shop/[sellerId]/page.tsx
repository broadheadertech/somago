// @ts-nocheck
"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/somago/product-card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

export default function SellerShopPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { isSignedIn } = useAuth();

  const seller = useQuery(api.users.getSellerProfile, { sellerId: sellerId as any });
  const sellerBadge = useQuery(api.users.getSellerBadge, { sellerId: sellerId as any });
  const products = useQuery(api.products.getBySellerId, { sellerId: sellerId as any });
  const isFollowing = useQuery(
    api.follows.isFollowing,
    isSignedIn ? { sellerId: sellerId as any } : "skip"
  );
  const followerCount = useQuery(api.follows.getFollowerCount, { sellerId: sellerId as any });
  const toggleFollow = useMutation(api.follows.toggle);
  const [isToggling, setIsToggling] = useState(false);

  if (seller === undefined || products === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-4">
        <Skeleton className="mb-4 h-32 w-full rounded-xl" />
        <Skeleton className="mb-2 h-6 w-1/2" />
        <Skeleton className="mb-4 h-4 w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (seller === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Shop not found</h1>
        <p className="mt-2 text-neutral-500">This seller may not exist or is not active.</p>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const totalProducts = products?.length ?? 0;
  const totalSold = products?.reduce((sum, p) => sum + p.soldCount, 0) ?? 0;
  const ratedProducts = products?.filter((p) => p.reviewCount > 0) ?? [];
  const avgRating =
    ratedProducts.length > 0
      ? ratedProducts.reduce((sum, p) => sum + p.rating * p.reviewCount, 0) /
        ratedProducts.reduce((sum, p) => sum + p.reviewCount, 0)
      : 0;

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to follow sellers");
      return;
    }
    setIsToggling(true);
    try {
      const result = await toggleFollow({ sellerId: sellerId as any });
      toast.success(result.following ? "Following seller!" : "Unfollowed seller");
    } catch (e: any) {
      toast.error(e.message || "Failed to update follow");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-20">
      {/* Shop Banner */}
      <div className="mb-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-200 text-2xl font-bold text-primary-700">
            {seller.shopProfile?.shopName?.charAt(0) || seller.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-neutral-900">
                {seller.shopProfile?.shopName || seller.name}
              </h1>
              {sellerBadge?.badge === "top_seller" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top Seller
                </span>
              )}
              {sellerBadge?.badge === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              {sellerBadge?.badge === "new" && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                  New Seller
                </span>
              )}
            </div>
            {seller.shopProfile?.description && (
              <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                {seller.shopProfile.description}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              Joined {new Date(seller.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short" })}
              {followerCount !== undefined && (
                <span className="ml-2">{followerCount} follower{followerCount !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
        </div>

        {/* Follow Button */}
        <div className="mt-3">
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className={
              isFollowing
                ? "border-primary-500 text-primary-600 hover:bg-primary-50"
                : "bg-primary-600 hover:bg-primary-700"
            }
            disabled={isToggling}
            onClick={handleToggleFollow}
          >
            {isToggling ? "..." : isFollowing ? "Following" : "+ Follow"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-white p-3 text-center">
          <p className="text-lg font-bold text-primary-600">{totalProducts}</p>
          <p className="text-xs text-neutral-500">Products</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-3 text-center">
          <p className="text-lg font-bold text-neutral-900">{totalSold.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Total Sold</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-3 text-center">
          <p className="text-lg font-bold text-neutral-900">
            {avgRating > 0 ? avgRating.toFixed(1) : "--"}
          </p>
          <p className="text-xs text-neutral-500">Avg Rating</p>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Products Grid */}
      <h2 className="mb-3 text-base font-semibold text-neutral-900">
        Products ({totalProducts})
      </h2>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              imageUrl={product.imageUrl ?? null}
              rating={product.rating}
              reviewCount={product.reviewCount}
              soldCount={product.soldCount}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-neutral-500 py-8">
          This seller has no active products yet.
        </p>
      )}
    </div>
  );
}
