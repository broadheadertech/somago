"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={cn("aspect-square overflow-hidden rounded-xl bg-neutral-100", className)}>
        <div className="flex h-full items-center justify-center text-neutral-300">
          <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && activeIndex < images.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (direction === "right" && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as any)._touchStartX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any)._touchStartX;
          if (!startX) return;
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (Math.abs(diff) > 50) {
            handleSwipe(diff > 0 ? "left" : "right");
          }
        }}
      >
        <img
          src={images[activeIndex]}
          alt={`${alt} - Image ${activeIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "";
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                onClick={() => handleSwipe("right")}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md transition-colors hover:bg-white"
              >
                <svg className="h-4 w-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {activeIndex < images.length - 1 && (
              <button
                onClick={() => handleSwipe("left")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md transition-colors hover:bg-white"
              >
                <svg className="h-4 w-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                i === activeIndex
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={url} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (mobile) */}
      {images.length > 1 && images.length <= 6 && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === activeIndex ? "w-4 bg-primary-500" : "w-1.5 bg-neutral-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
