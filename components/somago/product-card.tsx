"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "./optimized-image";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
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
  className,
}: ProductCardProps) {
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <Link
      href={`/product/${id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
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
          className="object-cover transition-transform group-hover:scale-105"
        />
        {discount && (
          <Badge className="absolute left-1.5 top-1.5 bg-accent-orange text-white text-[10px] px-1.5 py-0.5 z-20">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-sm leading-tight text-foreground">
          {name}
        </h3>

        <div className="mt-auto flex flex-col gap-1">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-primary-600">
              ₱{price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-neutral-500 line-through">
                ₱{originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating + Sold */}
          <div className="flex items-center gap-2">
            {reviewCount > 0 && (
              <StarRating rating={rating} size="sm" />
            )}
            <span className="text-[11px] text-neutral-500">
              {soldCount > 0 ? `${soldCount.toLocaleString()} sold` : "New"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
