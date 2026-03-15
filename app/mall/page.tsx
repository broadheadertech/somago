// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function MallPage() {
  const mallSellers = useQuery(api.mall.getMallSellers);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Mall Header */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-primary-800 to-secondary-700 p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🏬</span>
          <h1 className="text-2xl font-bold sm:text-3xl">Somago Mall</h1>
        </div>
        <p className="max-w-lg text-primary-100">
          Shop from verified brand stores with guaranteed authenticity, premium customer service, and exclusive deals.
        </p>
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm">100% Authentic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">Buyer Protection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm">Fast Shipping</span>
          </div>
        </div>
      </div>

      {/* Mall Stores */}
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Official Stores</h2>

      {mallSellers === undefined ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : mallSellers.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-5xl">🏬</span>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">No Mall stores yet</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Verified brand stores will appear here. Are you a brand?{" "}
            <Link href="/sell" className="text-primary-600 hover:underline">Apply now</Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mallSellers.map((seller) => (
            <Link
              key={seller._id}
              href={`/shop/${seller._id}`}
              className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-primary-100 to-primary-50">
                {seller.shopProfile?.bannerUrl && (
                  <img
                    src={seller.shopProfile.bannerUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Store Info */}
              <div className="relative px-4 pb-4">
                <div className="absolute -top-8 left-4 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white bg-primary-600 text-2xl font-bold text-white shadow">
                  {seller.shopProfile?.logoUrl ? (
                    <img src={seller.shopProfile.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    seller.shopProfile?.shopName?.[0]?.toUpperCase() || "S"
                  )}
                </div>
                <div className="pt-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600">
                      {seller.shopProfile?.shopName || seller.name}
                    </h3>
                    <Badge className="bg-primary-100 text-primary-700 text-[10px]">
                      Mall
                    </Badge>
                  </div>
                  {seller.shopProfile?.description && (
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                      {seller.shopProfile.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-[11px] text-neutral-500">
                    <span>{seller.productCount ?? 0} products</span>
                    <span>{seller.followerCount ?? 0} followers</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
