// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function NewProductPage() {
  return (
    <AuthGuard message="Please sign in to list a new product." requiredRole="seller">
      <NewProductPageContent />
    </AuthGuard>
  );
}

function NewProductPageContent() {
  const router = useRouter();
  const categories = useQuery(api.categories.list);
  const createProduct = useMutation(api.products.create);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [variants, setVariants] = useState<Array<{
    name: string;
    options: Array<{ label: string; price: string; stock: string }>;
  }>>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    originalPrice: "",
    stock: "",
  });

  if (categories === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const topCategories = categories?.filter((c) => !c.parentId) ?? [];
  const commission = form.price ? Number(form.price) * 0.05 : 0;
  const earnings = form.price ? Number(form.price) - commission : 0;

  const handleSubmit = async () => {
    if (!form.name || !form.categoryId || !form.price || !form.stock) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build variants for backend
      const variantsData = variants
        .filter((v) => v.name && v.options.some((o) => o.label))
        .map((v) => ({
          name: v.name,
          options: v.options
            .filter((o) => o.label)
            .map((o) => ({
              label: o.label,
              price: o.price ? Number(o.price) : undefined,
              stock: o.stock ? Number(o.stock) : Number(form.stock),
            })),
        }));

      await createProduct({
        name: form.name,
        description: form.description,
        categoryId: form.categoryId as any,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        images: uploadedStorageId ? [uploadedStorageId as any] : [],
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : undefined,
        imageUrls: imageUrls.filter((u) => u.startsWith("http")).length > 0
          ? imageUrls.filter((u) => u.startsWith("http"))
          : undefined,
        variants: variantsData.length > 0 ? variantsData : undefined,
      });
      toast.success("Product published! 🎉");
      router.push("/seller/products");
    } catch (e: any) {
      toast.error(e.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Add New Product</h1>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {["Photos", "Details", "Pricing", "Review"].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                step > i + 1 ? "bg-primary-500" : step === i + 1 ? "bg-primary-300" : "bg-neutral-200"
              }`}
            />
            <span className={`text-xs ${step >= i + 1 ? "text-primary-600 font-medium" : "text-neutral-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Photos (up to 10) */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Product Photos</h2>
          <p className="text-xs text-neutral-500">Add up to 10 photos. First photo is the cover image.</p>

          {/* Image Grid */}
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>
                )}
                <button
                  onClick={() => {
                    // Revoke object URL to prevent memory leak
                    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
                    setImageUrls(imageUrls.filter((_, j) => j !== i));
                  }}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 shadow"
                >
                  <svg className="h-3.5 w-3.5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {imageUrls.length < 10 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100">
                <div className="text-center">
                  <svg className="mx-auto h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="mt-1 text-[10px]">{isUploading ? "Uploading..." : "Add"}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      const url = await generateUploadUrl();
                      const result = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
                      const { storageId } = await result.json();
                      setUploadedStorageId(storageId);
                      // Use object URL as preview, revoke old ones on cleanup
                      const objectUrl = URL.createObjectURL(file);
                      setImageUrls((prev) => [...prev, objectUrl]);
                    } catch {
                      toast.error("Upload failed — try using an image URL instead");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* OR Paste URL */}
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 border-t border-neutral-200" />
            <p className="relative mx-auto w-fit bg-background px-3 text-xs text-neutral-500">or paste image URL</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/product-photo.jpg"
              className="flex-1"
            />
            <Button
              variant="outline"
              disabled={!newImageUrl || imageUrls.length >= 10}
              onClick={() => {
                if (newImageUrl) {
                  setImageUrls([...imageUrls, newImageUrl]);
                  setNewImageUrl("");
                }
              }}
            >
              Add
            </Button>
          </div>

          <Button
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={imageUrls.length === 0}
            onClick={() => {
              setImageUrl(imageUrls[0] || "");
              setStep(2);
            }}
          >
            Continue to Details ({imageUrls.length} photo{imageUrls.length !== 1 ? "s" : ""})
          </Button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Product Details</h2>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Product Name *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hand-Embroidered Blouse"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {topCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your product..."
                rows={4}
              />
            </div>
          </div>

          {/* Variants */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">Variants (optional)</label>
              {variants.length < 3 && (
                <button
                  type="button"
                  onClick={() => setVariants([...variants, { name: "", options: [{ label: "", price: "", stock: "" }] }])}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  + Add variant type
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-neutral-500">
              e.g. Size (S, M, L) or Color (Red, Blue). Each option can have its own price and stock.
            </p>

            {variants.map((variant, vi) => (
              <div key={vi} className="mb-3 rounded-md bg-neutral-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={variant.name}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[vi].name = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Variant name (e.g. Size, Color)"
                    className="flex-1 bg-white text-sm"
                  />
                  <button
                    onClick={() => setVariants(variants.filter((_, i) => i !== vi))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                {variant.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-1.5">
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[vi].options[oi].label = e.target.value;
                        setVariants(updated);
                      }}
                      placeholder="Option (e.g. S, M, L)"
                      className="flex-1 bg-white text-sm"
                    />
                    <Input
                      value={opt.price}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[vi].options[oi].price = e.target.value;
                        setVariants(updated);
                      }}
                      placeholder="Price"
                      type="number"
                      className="w-24 bg-white text-sm"
                    />
                    <Input
                      value={opt.stock}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[vi].options[oi].stock = e.target.value;
                        setVariants(updated);
                      }}
                      placeholder="Stock"
                      type="number"
                      className="w-20 bg-white text-sm"
                    />
                    {variant.options.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = [...variants];
                          updated[vi].options = updated[vi].options.filter((_, i) => i !== oi);
                          setVariants(updated);
                        }}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => {
                    const updated = [...variants];
                    updated[vi].options.push({ label: "", price: "", stock: "" });
                    setVariants(updated);
                  }}
                  className="mt-1 text-xs text-primary-600 hover:underline"
                >
                  + Add option
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              onClick={() => setStep(3)}
              disabled={!form.name || !form.categoryId}
            >
              Continue to Pricing
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Pricing & Stock</h2>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Price (₱) *
              </label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Original Price (₱) — optional
              </label>
              <Input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="0.00 (for showing discount)"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Stock Quantity *
              </label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>

            {form.price && (
              <div className="rounded-lg bg-primary-50 p-3">
                <p className="text-xs text-neutral-500">Commission (5%): ₱{commission.toFixed(2)}</p>
                <p className="text-sm font-medium text-primary-700">
                  You earn: ₱{earnings.toFixed(2)} per sale
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              onClick={() => setStep(4)}
              disabled={!form.price || !form.stock}
            >
              Review Product
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900">Review & Publish</h2>

          <div className="rounded-lg border border-border bg-white p-4 space-y-3">
            <div>
              <p className="text-xs text-neutral-500">Product Name</p>
              <p className="text-sm font-medium text-neutral-900">{form.name}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Category</p>
              <p className="text-sm text-neutral-900">
                {topCategories.find((c) => c._id === form.categoryId)?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Price</p>
              <p className="text-sm font-bold text-primary-600">₱{Number(form.price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Stock</p>
              <p className="text-sm text-neutral-900">{form.stock} units</p>
            </div>
            {form.description && (
              <div>
                <p className="text-xs text-neutral-500">Description</p>
                <p className="text-sm text-neutral-700">{form.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
            <Button
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Product"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
