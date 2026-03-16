// @ts-nocheck
"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  priority = false,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-100 text-neutral-300",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-3xl">📦</span>
      </div>
    );
  }

  // If Next.js Image fails, fall back to regular img
  if (hasError) {
    return (
      <div className={cn("relative overflow-hidden", fill ? "h-full w-full" : undefined)}>
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", className)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", fill ? "h-full w-full" : undefined)}>
      {isLoading && (
        <div
          className="absolute inset-0 z-10 animate-pulse bg-neutral-100"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
