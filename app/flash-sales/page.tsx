// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

function CountdownTimer({ endAt }: { endAt: number }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (timeLeft === 0) {
    return <span className="text-sm font-medium text-red-500">Ended</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {[
        { value: hours, label: "h" },
        { value: minutes, label: "m" },
        { value: seconds, label: "s" },
      ].map((unit, i) => (
        <span key={i} className="flex items-center">
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded bg-neutral-900 px-1.5 py-0.5 text-sm font-bold tabular-nums text-white">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="ml-0.5 text-xs text-neutral-500">{unit.label}</span>
          {i < 2 && <span className="ml-1 text-neutral-300">:</span>}
        </span>
      ))}
    </div>
  );
}

function StockProgressBar({ sold, limit }: { sold: number; limit?: number }) {
  if (limit === undefined) return null;
  const pct = Math.min(100, (sold / limit) * 100);
  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-accent-orange transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {sold}/{limit} sold
      </p>
    </div>
  );
}

export default function FlashSalesPage() {
  const sales = useQuery(api.flashSales.getActive);

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-24">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-6 w-6 text-accent-orange" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
        </svg>
        <h1 className="text-xl font-bold text-neutral-900">Flash Sales</h1>
        <Badge className="bg-accent-orange text-white">LIVE</Badge>
      </div>

      {/* Loading state */}
      {sales === undefined && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Skeleton className="mb-3 h-40 w-full rounded-lg" />
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sales && sales.length === 0 && (
        <div className="py-20 text-center">
          <svg className="mx-auto mb-3 h-12 w-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
          </svg>
          <h2 className="text-lg font-semibold text-neutral-700">No flash sales right now</h2>
          <p className="mt-1 text-sm text-neutral-500">Check back later for amazing deals!</p>
          <Link href="/">
            <Button className="mt-4 bg-primary-600 hover:bg-primary-700">Browse Products</Button>
          </Link>
        </div>
      )}

      {/* Sale cards */}
      {sales && sales.length > 0 && (
        <div className="space-y-4">
          {sales.map((sale) => {
            const product = sale.product;
            if (!product) return null;
            const discount = Math.round(
              ((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100
            );
            const imageUrl =
              product.imageUrls?.[0] ?? product.imageUrl ?? null;

            return (
              <div
                key={sale._id}
                className="overflow-hidden rounded-xl border border-border bg-white"
              >
                <div className="flex gap-0">
                  {/* Product image */}
                  <div className="relative h-44 w-44 flex-shrink-0 bg-neutral-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-300">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <Badge className="absolute left-2 top-2 bg-accent-orange text-white">
                      -{discount}%
                    </Badge>
                  </div>

                  {/* Product info */}
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
                        {product.name}
                      </h3>

                      {/* Pricing */}
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary-600">
                          ₱{sale.salePrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-neutral-400 line-through">
                          ₱{sale.originalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stock progress */}
                    <div className="mt-2">
                      <StockProgressBar sold={sale.soldCount} limit={sale.stockLimit} />
                    </div>

                    {/* Countdown + CTA */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <CountdownTimer endAt={sale.endAt} />
                      <Link href={`/product/${product._id}`}>
                        <Button
                          size="sm"
                          className="bg-primary-600 hover:bg-primary-700 text-xs"
                        >
                          Shop Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
