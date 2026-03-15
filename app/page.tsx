// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { ProductGridSkeleton } from "@/components/somago/product-card-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useState } from "react";

export default function Home() {
  const categories = useQuery(api.categories.getTopLevel);
  const products = useQuery(api.products.list, { limit: 20 });
  const personalized = useQuery(api.products.getPersonalized, { limit: 8 });
  const recentlyViewedIds = useRecentlyViewed();
  const recentlyViewed = useQuery(
    api.products.getByIds,
    recentlyViewedIds.length > 0 ? { ids: recentlyViewedIds as any } : "skip"
  );
  const announcements = useQuery(api.siteContent.getByType, { type: "announcement" });
  const banners = useQuery(api.siteContent.getByType, { type: "banner" });
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Announcements Bar */}
      {announcements && announcements.length > 0 && (
        <div className="mb-4 space-y-2">
          {announcements
            .filter((a) => !dismissedAnnouncements.has(a._id))
            .map((announcement) => (
              <div
                key={announcement._id}
                className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-yellow-600 text-sm font-medium">📢</span>
                  {announcement.linkUrl ? (
                    <a href={announcement.linkUrl} className="text-sm text-yellow-800 hover:underline truncate">
                      {announcement.title || announcement.body}
                    </a>
                  ) : (
                    <span className="text-sm text-yellow-800 truncate">
                      {announcement.title || announcement.body}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDismissedAnnouncements((prev) => new Set([...prev, announcement._id]))}
                  className="ml-2 shrink-0 text-yellow-400 hover:text-yellow-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* CMS Banners Carousel */}
      {banners && banners.length > 0 && (
        <div className="mb-6 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="min-w-70 max-w-sm shrink-0 rounded-xl overflow-hidden border border-border bg-white"
            >
              {banner.imageUrl && (
                <img src={banner.imageUrl} alt={banner.title || ""} className="h-36 w-full object-cover" />
              )}
              <div className="p-3">
                {banner.title && (
                  <h3 className="text-sm font-semibold text-neutral-900">{banner.title}</h3>
                )}
                {banner.body && (
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{banner.body}</p>
                )}
                {banner.linkUrl && (
                  <a href={banner.linkUrl} className="mt-2 inline-block text-xs font-medium text-primary-600 hover:underline">
                    Learn more →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white sm:p-10">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Welcome to Somago
        </h1>
        <p className="mt-2 max-w-md text-primary-100">
          Your marketplace for Southeast Asia. Discover thousands of products
          from trusted sellers.
        </p>
        <Link href="/categories">
          <Button className="mt-4 bg-white text-primary-700 hover:bg-primary-50">
            Browse Categories
          </Button>
        </Link>
      </div>

      {/* Category Icons */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Categories
        </h2>
        {!categories ? (
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categories?cat=${cat._id}`}
                className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-primary-50"
              >
                <span className="text-2xl">{cat.icon || "📦"}</span>
                <span className="text-[11px] text-neutral-700 text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recommended For You */}
      {personalized && personalized.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Recommended For You
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {personalized.map((product) => (
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
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Recently Viewed
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentlyViewed.map((product) => (
              <div key={product._id} className="min-w-37.5 max-w-45 shrink-0">
                <ProductCard
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  imageUrl={product.imageUrl ?? null}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  soldCount={product.soldCount}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Products For You
        </h2>
        {!products ? (
          <ProductGridSkeleton count={10} />
        ) : products.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            No products yet. Be the first seller to list a product!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
        )}
      </section>
    </div>
  );
}
