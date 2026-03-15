// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompare } from "@/lib/compare";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/somago/star-rating";
import Link from "next/link";

export default function ComparePage() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const products = useQuery(
    api.products.getByIds,
    compareIds.length > 0 ? { ids: compareIds as any } : "skip"
  );

  if (compareIds.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mb-4 text-4xl">🔍</div>
        <h1 className="text-xl font-bold text-neutral-900">No Products to Compare</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Add up to 3 products to compare them side by side.
        </p>
        <Link href="/">
          <Button className="mt-4 bg-primary-600 hover:bg-primary-700">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  if (products === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const fields = [
    { label: "Price", render: (p: any) => <span className="font-bold text-primary-600">₱{p.price.toLocaleString()}</span> },
    { label: "Rating", render: (p: any) => <StarRating rating={p.rating} size="sm" showValue /> },
    { label: "Reviews", render: (p: any) => <span>{p.reviewCount}</span> },
    { label: "Stock", render: (p: any) => (
      <span className={p.stock === 0 ? "text-red-500" : "text-neutral-900"}>
        {p.stock === 0 ? "Out of stock" : p.stock}
      </span>
    )},
    { label: "Sold", render: (p: any) => <span>{p.soldCount.toLocaleString()}</span> },
    { label: "Description", render: (p: any) => (
      <p className="text-xs leading-relaxed text-neutral-600 line-clamp-4">{p.description}</p>
    )},
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Compare Products</h1>
          <p className="text-sm text-neutral-500">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearCompare}>
          Clear All
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-28 px-3 py-3 text-left font-medium text-neutral-500"></th>
              {products.map((product) => (
                <th key={product._id} className="px-3 py-3 text-center min-w-[180px]">
                  {/* Product Image */}
                  <Link href={`/product/${product._id}`}>
                    <div className="mx-auto mb-2 h-32 w-32 overflow-hidden rounded-lg bg-neutral-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-400 text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link href={`/product/${product._id}`}>
                    <p className="font-semibold text-neutral-900 hover:text-primary-600 line-clamp-2">
                      {product.name}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeFromCompare(product._id)}
                    className="mt-1 text-xs text-neutral-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.label} className="border-b border-border">
                <td className="px-3 py-3 text-xs font-medium text-neutral-500 align-top">
                  {field.label}
                </td>
                {products.map((product) => (
                  <td key={product._id} className="px-3 py-3 text-center align-top">
                    {field.render(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
