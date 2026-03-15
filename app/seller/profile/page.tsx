// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SellerProfilePage() {
  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateShopProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const mallStatus = useQuery(api.mall.getMyMallStatus);
  const applyForMall = useMutation(api.mall.applyForMall);

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedLogoId, setUploadedLogoId] = useState<string | null>(null);

  // Mall application form
  const [showMallForm, setShowMallForm] = useState(false);
  const [mallBrandName, setMallBrandName] = useState("");
  const [mallBrandDesc, setMallBrandDesc] = useState("");
  const [mallBizReg, setMallBizReg] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Load existing data
  useEffect(() => {
    if (me?.shopProfile) {
      setShopName(me.shopProfile.shopName || "");
      setDescription(me.shopProfile.description || "");
      setShippingPolicy(me.shopProfile.shippingPolicy || "");
      setBannerUrl(me.shopProfile.bannerUrl || "");
      if (me.shopProfile.logoUrl) setLogoPreview(me.shopProfile.logoUrl);
      if (me.shopProfile.bannerUrl) setBannerPreview(me.shopProfile.bannerUrl);
    }
  }, [me]);

  if (me === undefined) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      // Revoke previous blob URL if it was a blob
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(preview);
      const url = await generateUploadUrl();
      const result = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      setUploadedLogoId(storageId);
    } catch {
      toast.error("Logo upload failed");
      setLogoPreview(me?.shopProfile?.logoUrl || null);
      URL.revokeObjectURL(preview);
    } finally {
      setIsUploading(false);
    }
  };

  const [uploadedBannerId, setUploadedBannerId] = useState<string | null>(null);

  const handleBannerUpload = async (file: File) => {
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      setBannerPreview(preview);
      const url = await generateUploadUrl();
      const result = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await result.json();
      setUploadedBannerId(storageId);
    } catch {
      toast.error("Banner upload failed");
      setBannerPreview(me?.shopProfile?.bannerUrl || null);
      URL.revokeObjectURL(preview);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        shopName: shopName.trim(),
        description: description.trim() || undefined,
        shippingPolicy: shippingPolicy.trim() || undefined,
        logo: uploadedLogoId ? (uploadedLogoId as any) : undefined,
        banner: uploadedBannerId ? (uploadedBannerId as any) : undefined,
        bannerUrl: bannerUrl.startsWith("http") ? bannerUrl : undefined,
      });
      toast.success("Shop profile updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMallApply = async () => {
    if (!mallBrandName.trim() || !mallBrandDesc.trim()) {
      toast.error("Brand name and description are required");
      return;
    }
    setIsApplying(true);
    try {
      await applyForMall({
        brandName: mallBrandName.trim(),
        brandDescription: mallBrandDesc.trim(),
        businessRegistration: mallBizReg.trim() || undefined,
      });
      toast.success("Mall application submitted!");
      setShowMallForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  const shopUrl = typeof window !== "undefined"
    ? `${window.location.origin}/shop/${me?._id}`
    : `/shop/${me?._id}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Shop Profile</h1>
          <p className="text-sm text-neutral-500">Customize how buyers see your shop</p>
        </div>
        <Link href={`/shop/${me?._id}`} target="_blank">
          <Button variant="outline" size="sm">View Storefront</Button>
        </Link>
      </div>

      {/* Banner & Logo Preview (Shopee style) */}
      <Card className="overflow-hidden">
        {/* Banner */}
        <div className="relative h-36 bg-gradient-to-r from-primary-100 to-primary-50">
          {bannerPreview && (
            <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
          )}
          <label className="absolute right-3 bottom-3 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Edit Banner
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBannerUpload(file);
            }} />
          </label>
        </div>

        {/* Logo + Shop Name */}
        <div className="relative px-5 pb-5">
          <div className="absolute -top-10 left-5">
            <label className="group relative block cursor-pointer">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-primary-600 text-2xl font-bold text-white shadow-lg">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  shopName?.[0]?.toUpperCase() || me?.name?.[0]?.toUpperCase() || "S"
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }} />
            </label>
          </div>
          <div className="pt-12">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900">
                {shopName || me?.name || "Your Shop"}
              </h2>
              {me?.mallStatus === "approved" && (
                <Badge className="bg-primary-100 text-primary-700 text-[10px]">Mall</Badge>
              )}
              {me?.subscriptionPlan && me.subscriptionPlan !== "free" && (
                <Badge className="bg-yellow-100 text-yellow-700 text-[10px] capitalize">{me.subscriptionPlan}</Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">{description || "No description yet"}</p>
          </div>
        </div>
      </Card>

      {/* Shop URL */}
      <Card>
        <CardContent className="pt-4">
          <label className="mb-1 block text-sm font-medium text-neutral-700">Your Shop URL</label>
          <div className="flex items-center gap-2">
            <Input value={shopUrl} readOnly className="flex-1 bg-neutral-50 font-mono text-xs" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shopUrl);
                toast.success("Link copied!");
              }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Shop Name *</label>
            <Input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g., Rina's Handmade Clothes"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Shop Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about your shop — what you sell, your story, etc."
              maxLength={1000}
              className="h-24"
            />
            <p className="mt-1 text-xs text-neutral-400">{description.length}/1000</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Banner Image URL</label>
            <Input
              value={bannerUrl.startsWith("pending:") ? "" : bannerUrl}
              onChange={(e) => {
                setBannerUrl(e.target.value);
                setBannerPreview(e.target.value || null);
              }}
              placeholder="https://example.com/your-banner.jpg"
            />
            <p className="mt-1 text-xs text-neutral-400">Or upload using the "Edit Banner" button above</p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipping Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={shippingPolicy}
            onChange={(e) => setShippingPolicy(e.target.value)}
            placeholder="Describe your shipping policy — processing time, carriers used, delivery estimates, return policy..."
            maxLength={2000}
            className="h-32"
          />
          <p className="mt-1 text-xs text-neutral-400">{shippingPolicy.length}/2000</p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full bg-primary-600 hover:bg-primary-700 h-12 text-base"
        onClick={handleSave}
        disabled={isSaving || isUploading}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>

      <Separator />

      {/* Somago Mall Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏬</span>
              <CardTitle className="text-base">Somago Mall</CardTitle>
            </div>
            {mallStatus?.mallStatus === "approved" && (
              <Badge className="bg-primary-100 text-primary-700">Approved</Badge>
            )}
            {mallStatus?.mallStatus === "pending" && (
              <Badge className="bg-yellow-100 text-yellow-700">Pending Review</Badge>
            )}
            {mallStatus?.mallStatus === "rejected" && (
              <Badge className="bg-red-100 text-red-700">Rejected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {mallStatus?.mallStatus === "approved" ? (
            <div className="space-y-2">
              <p className="text-sm text-primary-700 font-medium">Your shop is a verified Mall store!</p>
              <p className="text-xs text-neutral-500">Your products appear with the Mall badge and are featured on the Somago Mall page.</p>
            </div>
          ) : mallStatus?.mallStatus === "pending" ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-700">Your Mall application is under review.</p>
              <p className="text-xs text-neutral-500">We'll notify you once the review is complete (usually within 48 hours).</p>
            </div>
          ) : mallStatus?.mallStatus === "rejected" ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-700">Your Mall application was not approved.</p>
              {mallStatus?.application?.adminNotes && (
                <p className="text-xs text-neutral-500 italic">Reason: {mallStatus.application.adminNotes}</p>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowMallForm(true)}>
                Reapply
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700">
                Become a verified brand store on Somago Mall. Mall sellers get a verified badge,
                premium placement, and priority customer support.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">✓ Verified badge</span>
                <span className="flex items-center gap-1">✓ Mall page listing</span>
                <span className="flex items-center gap-1">✓ Priority support</span>
                <span className="flex items-center gap-1">✓ Brand storefront</span>
              </div>
              {!showMallForm ? (
                <Button
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => setShowMallForm(true)}
                >
                  Apply for Mall
                </Button>
              ) : (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Brand Name *</label>
                    <Input
                      value={mallBrandName}
                      onChange={(e) => setMallBrandName(e.target.value)}
                      placeholder="e.g., Rina's Official"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Brand Description *</label>
                    <Textarea
                      value={mallBrandDesc}
                      onChange={(e) => setMallBrandDesc(e.target.value)}
                      placeholder="Tell us about your brand — what makes it unique, your story..."
                      maxLength={2000}
                      className="h-20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Business Registration (Optional)</label>
                    <Input
                      value={mallBizReg}
                      onChange={(e) => setMallBizReg(e.target.value)}
                      placeholder="SEC/DTI Registration Number"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={handleMallApply}
                      disabled={isApplying}
                    >
                      {isApplying ? "Submitting..." : "Submit Application"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowMallForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Your Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/seller/products" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>📦</span> Products
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>📋</span> Orders
            </Link>
            <Link href="/seller/vouchers" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>🏷️</span> Vouchers
            </Link>
            <Link href="/seller/analytics" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>📊</span> Analytics
            </Link>
            <Link href="/seller/subscription" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>💎</span> Subscription
            </Link>
            <Link href="/seller/api-keys" className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>🔑</span> API Keys
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
