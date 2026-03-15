// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function EditProductPage() {
  return (
    <AuthGuard message="Please sign in to edit your product." requiredRole="seller">
      <EditProductPageContent />
    </AuthGuard>
  );
}

function EditProductPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const product = useQuery(api.products.getById, { productId: id as any });
  const categories = useQuery(api.categories.list);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    originalPrice: "",
    stock: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        stock: String(product.stock),
      });
    }
  }, [product]);

  if (product === undefined || categories === undefined) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Product not found</h1>
      </div>
    );
  }

  const topCategories = categories?.filter((c) => !c.parentId) ?? [];

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateProduct({
        productId: product._id,
        name: form.name,
        description: form.description,
        categoryId: form.categoryId as any,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
      });
      toast.success("Product updated!");
      router.push("/seller/products");
    } catch (e: any) {
      toast.error(e.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    try {
      await removeProduct({ productId: product._id });
      toast.success("Product removed");
      router.push("/seller/products");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove product");
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Edit Product</h1>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Product Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
          >
            {topCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Price (₱)</label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              min="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Original Price</label>
            <Input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Stock Quantity</label>
          <Input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            min="0"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1 bg-primary-600 hover:bg-primary-700"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          className="text-error hover:bg-red-50"
          onClick={handleRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
