// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BannerSlide {
  id: string;
  imageUrl?: string | null;
  title?: string | null;
  body?: string | null;
  linkUrl?: string | null;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlayMs?: number;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: "default-1",
    title: "Summer Sale",
    body: "Up to 70% OFF on selected items",
    linkUrl: "/flash-sales",
  },
  {
    id: "default-2",
    title: "Free Shipping",
    body: "On orders above ₱999",
    linkUrl: "/categories",
  },
  {
    id: "default-3",
    title: "New Arrivals",
    body: "Check out the latest products",
    linkUrl: "/categories",
  },
];

const GRADIENT_COLORS = [
  "from-primary-500 to-primary-700",
  "from-neutral-900 to-neutral-700",
  "from-primary-700 to-neutral-900",
];

export function BannerCarousel({ slides, autoPlayMs = 4000 }: BannerCarouselProps) {
  const allSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % allSlides.length);
  }, [allSlides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  }, [allSlides.length]);

  // Auto-play
  useEffect(() => {
    if (allSlides.length <= 1 || isHovered) return;
    const interval = setInterval(next, autoPlayMs);
    return () => clearInterval(interval);
  }, [next, autoPlayMs, allSlides.length, isHovered]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {allSlides.map((slide, i) => (
          <div key={slide.id} className="w-full shrink-0">
            {slide.imageUrl ? (
              <a href={slide.linkUrl || "#"} className="block">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || ""}
                  className="h-36 w-full object-cover sm:h-44"
                />
              </a>
            ) : (
              <Link
                href={slide.linkUrl || "/categories"}
                className={cn(
                  "flex h-36 flex-col justify-center bg-linear-to-r p-6 sm:h-44",
                  GRADIENT_COLORS[i % GRADIENT_COLORS.length]
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {slide.body || "Shop Now"}
                </p>
                <p className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  {slide.title || "Discover Deals"}
                </p>
                <span className="mt-3 inline-block self-start rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary-600">
                  SHOP NOW
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Arrow buttons (desktop) */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm hover:bg-black/50 sm:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm hover:bg-black/50 sm:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {allSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
