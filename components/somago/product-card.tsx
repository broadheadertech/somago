// @ts-nocheck
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { OptimizedImage } from "./optimized-image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  freeShipping?: boolean;
  isMall?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  rating,
  reviewCount,
  soldCount,
  freeShipping = false,
  isMall = false,
  className,
}: ProductCardProps) {
  const { isSignedIn } = useAuth();
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const [hearted, setHearted] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const showFreeShipping = freeShipping || price >= 999;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setHearted(!hearted);
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);
    try {
      await toggleWishlist({ productId: id as any });
    } catch {}
  };

  return (
    <Link
      href={`/product/${id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <OptimizedImage
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount badge */}
        {discount && (
          <div className="absolute left-2 top-2 rounded-md bg-primary-600 px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-white">-{discount}%</span>
          </div>
        )}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all",
            heartAnimating && "animate-heart"
          )}
        >
          <svg
            className={cn("h-4.5 w-4.5", hearted ? "fill-primary-500 text-primary-500" : "fill-none text-neutral-500")}
            stroke="currentColor"
            strokeWidth={hearted ? 0 : 1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-snug text-neutral-800">
          {name}
        </h3>

        {/* Free shipping badge */}
        {showFreeShipping && (
          <span className="self-start rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            Free Shipping
          </span>
        )}

        <div className="mt-auto space-y-1 pt-1">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-primary-600">
              ₱{price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-neutral-400 line-through">
                ₱{originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating + Sold */}
          <div className="flex items-center gap-1.5">
            {reviewCount > 0 && (
              <>
                <span className="text-xs text-accent-yellow">★</span>
                <span className="text-xs text-neutral-600">{rating.toFixed(1)}</span>
              </>
            )}
            {soldCount > 0 && (
              <span className="text-xs text-neutral-400">
                {soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount} sold
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
