// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useState, useEffect } from "react";
import { BannerCarousel } from "@/components/somago/banner-carousel";

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 2, minutes: 45, seconds: 12 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      {[pad(time.hours), pad(time.minutes), pad(time.seconds)].map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-900 text-[11px] font-bold text-white">
            {v}
          </span>
          {i < 2 && <span className="text-xs font-bold text-neutral-400">:</span>}
        </div>
      ))}
    </div>
  );
}

function FlashSaleCard({ product }: { product: any }) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const soldPercent = Math.min(95, Math.floor((product.soldCount / (product.soldCount + 20)) * 100));
  const imgUrl = product.imageUrl || product.imageUrls?.[0];

  return (
    <Link href={`/product/${product._id}`} className="min-w-[130px] max-w-[130px] shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-50 text-3xl">📦</div>
        )}
        {discount > 0 && (
          <div className="absolute left-1 top-1 rounded bg-primary-600 px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-white">-{discount}%</span>
          </div>
        )}
      </div>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-sm font-bold text-primary-600">₱{product.price.toLocaleString()}</p>
        {product.originalPrice > product.price && (
          <p className="text-[10px] text-neutral-400 line-through">₱{product.originalPrice.toLocaleString()}</p>
        )}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
          <div className="h-full rounded-full bg-primary-500" style={{ width: `${soldPercent}%` }} />
        </div>
        <p className="text-[10px] text-neutral-500">{soldPercent}% Sold</p>
      </div>
    </Link>
  );
}

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

  // Use first few products with discounts as flash sale items
  const flashSaleProducts = products?.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 6) ?? [];

  return (
    <div className="mx-auto max-w-7xl pb-4">
      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="px-4 pt-2 space-y-1">
          {announcements
            .filter((a) => !dismissedAnnouncements.has(a._id))
            .map((a) => (
              <div key={a._id} className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5">
                <span className="text-xs text-yellow-800 truncate">{a.title || a.body}</span>
                <button onClick={() => setDismissedAnnouncements((prev) => new Set([...prev, a._id]))} className="ml-2 text-yellow-400">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* ── Banner Carousel ───────────────────────────────── */}
      <div className="px-4 pt-3">
        <BannerCarousel
          slides={(banners ?? []).map((b) => ({
            id: b._id,
            imageUrl: b.imageUrl,
            title: b.title,
            body: b.body,
            linkUrl: b.linkUrl,
          }))}
        />
      </div>

      {/* ── Categories ─────────────────────────────────────── */}
      <div className="px-4 pt-5">
        {!categories ? (
          <div className="grid grid-cols-5 gap-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-x-2 gap-y-4">
            {categories.map((cat) => {
              const colors = [
                "bg-blue-100 text-blue-500",
                "bg-pink-100 text-pink-500",
                "bg-cyan-100 text-cyan-500",
                "bg-purple-100 text-purple-500",
                "bg-amber-100 text-amber-500",
                "bg-emerald-100 text-emerald-500",
                "bg-rose-100 text-rose-500",
                "bg-indigo-100 text-indigo-500",
                "bg-orange-100 text-orange-500",
                "bg-teal-100 text-teal-500",
              ];
              const colorClass = colors[categories.indexOf(cat) % colors.length];
              return (
                <Link
                  key={cat._id}
                  href={`/categories?cat=${cat._id}`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
                    <span className="text-xl">{cat.icon || "📦"}</span>
                  </div>
                  <span className="max-w-14 text-center text-[10px] leading-tight text-neutral-600 line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Somago Live + Video (Shopee style) ────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 px-4">
        {/* Live */}
        <Link href="/live" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-1 px-3 pt-3 pb-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-600">Somago Live</p>
            <svg className="h-3 w-3 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </div>
          <div className="flex gap-1.5 px-3 pb-3">
            <div className="relative h-20 flex-1 overflow-hidden rounded-lg bg-neutral-100">
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-red-500 px-1 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-bold text-white">LIVE</span>
              </div>
              <div className="flex h-full items-center justify-center text-neutral-300 text-sm">🎥</div>
            </div>
            <div className="relative h-20 flex-1 overflow-hidden rounded-lg bg-neutral-100">
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-red-500 px-1 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-bold text-white">LIVE</span>
              </div>
              <div className="flex h-full items-center justify-center text-neutral-300 text-sm">🎥</div>
            </div>
          </div>
        </Link>

        {/* Video */}
        <Link href="/feed" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-1 px-3 pt-3 pb-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-600">Somago Video</p>
            <svg className="h-3 w-3 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </div>
          <div className="flex gap-1.5 px-3 pb-3">
            <div className="relative h-20 flex-1 overflow-hidden rounded-lg bg-neutral-100">
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-black/60 px-1 py-0.5">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span className="text-[8px] font-medium text-white">50.6K</span>
              </div>
              <div className="flex h-full items-center justify-center text-neutral-300 text-sm">📹</div>
            </div>
            <div className="relative h-20 flex-1 overflow-hidden rounded-lg bg-neutral-100">
              <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-black/60 px-1 py-0.5">
                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span className="text-[8px] font-medium text-white">2.1K</span>
              </div>
              <div className="flex h-full items-center justify-center text-neutral-300 text-sm">📹</div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Flash Sale ─────────────────────────────────────── */}
      {flashSaleProducts.length > 0 && (
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">Flash Sale</h2>
              {flashSaleProducts.length > 0 && <CountdownTimer />}
            </div>
            <Link href="/flash-sales" className="text-xs font-semibold text-primary-600">
              See More
            </Link>
          </div>
          <div className="mt-3 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {flashSaleProducts.map((product) => (
              <FlashSaleCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Viewed ────────────────────────────────── */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="mt-5 px-4">
          <h2 className="mb-3 text-base font-bold text-neutral-900">Recently Viewed</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recentlyViewed.slice(0, 6).map((product) => (
              <div key={product._id}>
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
        </div>
      )}

      {/* ── Just For You ───────────────────────────────────── */}
      <div className="mt-5 px-4">
        <h2 className="mb-3 text-base font-bold text-neutral-900">Just For You</h2>
        {!products ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <Skeleton className="aspect-square w-full rounded-t-2xl" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">No products yet</p>
          </div>
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
      </div>
    </div>
  );
}
