// @ts-nocheck
"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { ProductGridSkeleton } from "@/components/somago/product-card-skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { Suspense } from "react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const results = useQuery(
    api.products.search,
    query ? { query, limit: 30 } : "skip"
  );

  if (!query) {
    return (
      <EmptyState
        title="Search for products"
        description="Enter a search term to find products on Somago."
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
    );
  }

  if (!results) {
    return (
      <div>
        <p className="mb-4 text-sm text-neutral-500">
          Searching for &ldquo;{query}&rdquo;...
        </p>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title={`No results for "${query}"`}
        description="Try a different search term or browse categories."
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-500">
        {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((product) => (
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Search</h1>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
