// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function BulkEditPage() {
  return (
    <AuthGuard message="Please sign in to manage products." requiredRole="seller">
      <BulkEditContent />
    </AuthGuard>
  );
}

function BulkEditContent() {
  const products = useQuery(api.products.listMyProducts);
  const updateProduct = useMutation(api.products.update);

  const [edits, setEdits] = useState<
    Record<string, { newPrice?: string; newStock?: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Count changes
  const changedRows = products?.filter((p) => {
    const edit = edits[p._id];
    if (!edit) return false;
    const priceChanged = edit.newPrice !== undefined && edit.newPrice !== "" && parseFloat(edit.newPrice) !== p.price;
    const stockChanged = edit.newStock !== undefined && edit.newStock !== "" && parseInt(edit.newStock) !== p.stock;
    return priceChanged || stockChanged;
  }) ?? [];

  const handleSave = async () => {
    if (changedRows.length === 0) {
      toast.error("No changes to save");
      return;
    }

    setIsSaving(true);
    let success = 0;
    const failedNames: string[] = [];
    let failed = 0;

    for (const product of changedRows) {
      const edit = edits[product._id];
      try {
        const updates: Record<string, any> = {};
        if (edit.newPrice !== undefined && edit.newPrice !== "" && parseFloat(edit.newPrice) !== product.price) {
          updates.price = parseFloat(edit.newPrice);
        }
        if (edit.newStock !== undefined && edit.newStock !== "" && parseInt(edit.newStock) !== product.stock) {
          updates.stock = parseInt(edit.newStock);
        }
        if (Object.keys(updates).length > 0) {
          await updateProduct({ productId: product._id, ...updates });
          success++;
        }
      } catch (e: any) {
        failed++;
        failedNames.push(product.name);
      }
    }

    setIsSaving(false);
    setEdits({});
    if (failed === 0) {
      toast.success(`Updated ${success} product${success !== 1 ? "s" : ""} successfully!`);
    } else {
      toast.error(`Updated ${success}, failed ${failed}: ${failedNames.join(", ")}`);
    }
  };

  if (products === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Bulk Price & Stock Editor</h1>
          <p className="text-sm text-neutral-500">
            Edit prices and stock for all your products at once
          </p>
        </div>
        <Link href="/seller/products">
          <Button variant="outline" size="sm">Back to Products</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-neutral-500">No products found. Add some products first!</p>
        </div>
      ) : (
        <>
          {/* Change Counter */}
          {changedRows.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
              <p className="text-sm font-medium text-primary-700">
                {changedRows.length} product{changedRows.length !== 1 ? "s" : ""} changed
              </p>
              <Button
                className="bg-primary-600 hover:bg-primary-700"
                size="sm"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-700">Product</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-700 w-28">Current Price</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-700 w-32">New Price</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-700 w-24">Current Stock</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-700 w-32">New Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const edit = edits[product._id] ?? {};
                  const priceChanged = edit.newPrice !== undefined && edit.newPrice !== "" && parseFloat(edit.newPrice) !== product.price;
                  const stockChanged = edit.newStock !== undefined && edit.newStock !== "" && parseInt(edit.newStock) !== product.stock;

                  return (
                    <tr
                      key={product._id}
                      className={`${priceChanged || stockChanged ? "bg-primary-50/50" : "bg-white"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900 truncate max-w-xs">
                          {product.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        ₱{product.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={product.price.toString()}
                          value={edit.newPrice ?? ""}
                          onChange={(e) =>
                            setEdits({
                              ...edits,
                              [product._id]: { ...edit, newPrice: e.target.value },
                            })
                          }
                          className={`h-8 text-right text-sm ${priceChanged ? "border-primary-400 bg-primary-50" : ""}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder={product.stock.toString()}
                          value={edit.newStock ?? ""}
                          onChange={(e) =>
                            setEdits({
                              ...edits,
                              [product._id]: { ...edit, newStock: e.target.value },
                            })
                          }
                          className={`h-8 text-right text-sm ${stockChanged ? "border-primary-400 bg-primary-50" : ""}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
