// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/somago/auth-guard";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-neutral-100 text-neutral-800",
  pending: "bg-yellow-100 text-yellow-800",
  flagged: "bg-red-100 text-red-800",
};

export default function SellerProductsPage() {
  return (
    <AuthGuard message="Please sign in to manage your products." requiredRole="seller">
      <SellerProductsPageContent />
    </AuthGuard>
  );
}

function SellerProductsPageContent() {
  const products = useQuery(api.products.listMyProducts);
  const updateStock = useMutation(api.products.updateStock);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState("");

  if (products === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleSaveStock = async (productId: string) => {
    const newStock = parseInt(stockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Enter a valid stock number");
      return;
    }
    try {
      await updateStock({ productId: productId as any, stock: newStock });
      toast.success("Stock updated!");
      setEditingStock(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">
          My Products ({products.length})
        </h1>
        <Link href="/seller/products/new">
          <Button className="bg-primary-600 hover:bg-primary-700">+ Add Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="List your first product and start selling!"
          icon={<span className="text-3xl">📦</span>}
          action={
            <Link href="/seller/products/new">
              <Button className="bg-primary-600 hover:bg-primary-700">Add First Product</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex items-center gap-4 rounded-lg border border-border bg-white p-4"
            >
              {/* Product Image */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {product.name}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm font-bold text-primary-600">
                    ₱{product.price.toLocaleString()}
                  </span>

                  {/* Inline Stock Editor */}
                  {editingStock === product._id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={stockValue}
                        onChange={(e) => setStockValue(e.target.value)}
                        className="w-16 rounded border border-primary-300 px-1.5 py-0.5 text-xs"
                        min="0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveStock(product._id);
                          if (e.key === "Escape") setEditingStock(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveStock(product._id)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStock(null)}
                        className="text-xs text-neutral-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingStock(product._id);
                        setStockValue(String(product.stock));
                      }}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600"
                    >
                      Stock: {product.stock}
                      {product.stock < 5 && product.stock > 0 && (
                        <Badge className="ml-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0">Low</Badge>
                      )}
                      {product.stock === 0 && (
                        <Badge className="ml-1 bg-red-100 text-red-800 text-[10px] px-1.5 py-0">Out of Stock</Badge>
                      )}
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}

                  <span className="text-xs text-neutral-500">
                    {product.soldCount} sold
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[product.status] ?? "bg-neutral-100"}>
                  {product.status}
                </Badge>
                <Link href={`/seller/products/${product._id}`} className="text-xs text-primary-600 hover:underline">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
