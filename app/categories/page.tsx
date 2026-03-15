// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/somago/product-card";
import { ProductGridSkeleton } from "@/components/somago/product-card-skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const categories = useQuery(api.categories.getTopLevel);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // Handle URL params on mount
  useEffect(() => {
    const cat = searchParams.get("cat");
    const sub = searchParams.get("sub");
    if (cat) setSelectedCategory(cat);
    if (sub) setSelectedSub(sub);
  }, [searchParams]);

  const subcategories = useQuery(
    api.categories.getSubcategories,
    selectedCategory ? { parentId: selectedCategory as any } : "skip"
  );

  // Filter by subcategory if selected, otherwise by category
  const filterCategoryId = selectedSub || selectedCategory;
  const products = useQuery(
    api.products.list,
    filterCategoryId ? { categoryId: filterCategoryId as any, limit: 30 } : { limit: 30 }
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Categories</h1>

      {/* Category Grid */}
      {!categories ? (
        <div className="mb-6 grid grid-cols-5 gap-3 sm:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-5 gap-3 sm:grid-cols-10">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedSub(null); }}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
              !selectedCategory ? "bg-primary-100 ring-2 ring-primary-500" : "hover:bg-primary-50"
            }`}
          >
            <span className="text-2xl">🛒</span>
            <span className="text-[11px] text-neutral-700 text-center leading-tight">
              All
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => { setSelectedCategory(cat._id); setSelectedSub(null); }}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                selectedCategory === cat._id
                  ? "bg-primary-100 ring-2 ring-primary-500"
                  : "hover:bg-primary-50"
              }`}
            >
              <span className="text-2xl">{cat.icon || "📦"}</span>
              <span className="text-[11px] text-neutral-700 text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSub(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              !selectedSub
                ? "border-primary-500 bg-primary-50 text-primary-600"
                : "border-border bg-white text-neutral-700 hover:border-primary-500 hover:text-primary-600"
            }`}
          >
            All
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub._id}
              onClick={() => setSelectedSub(sub._id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedSub === sub._id
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-border bg-white text-neutral-700 hover:border-primary-500 hover:text-primary-600"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      {!products ? (
        <ProductGridSkeleton count={10} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="No products in this category yet."
          icon={<span className="text-3xl">📦</span>}
        />
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
  );
}
