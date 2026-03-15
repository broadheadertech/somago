// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AuthGuard } from "@/components/somago/auth-guard";

export default function SellerApplyPage() {
  return (
    <AuthGuard message="Please sign in to apply as a seller.">
      <SellerApplyPageContent />
    </AuthGuard>
  );
}

function SellerApplyPageContent() {
  const me = useQuery(api.users.getMe);
  const applyAsSeller = useMutation(api.users.applyAsSeller);
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (me === undefined) {
    return <div className="mx-auto max-w-lg px-4 py-8 text-center text-neutral-500">Loading...</div>;
  }

  if (me?.sellerStatus === "pending") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h1 className="text-xl font-bold text-neutral-900">Application Submitted</h1>
        <p className="mt-2 text-neutral-500">
          Your seller application is being reviewed. We&apos;ll notify you within 24 hours.
        </p>
      </div>
    );
  }

  if (me?.role === "seller") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-xl font-bold text-neutral-900">You&apos;re already a seller!</h1>
        <a href="/seller/dashboard" className="mt-4 inline-block text-primary-600 hover:underline">
          Go to Seller Dashboard →
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) {
      toast.error("Please enter a shop name");
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, we'd upload an ID document first
      // For now, we'll use a placeholder storage ID
      await applyAsSeller({
        shopName,
        businessType: businessType || undefined,
        idDocumentStorageId: "placeholder" as any,
      });
      toast.success("Application submitted!");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-4 text-5xl">🛍️</div>
        <h1 className="text-xl font-bold text-neutral-900">Sell on Somago</h1>
        <p className="mt-2 text-neutral-500">
          Start your online business and reach thousands of buyers across Southeast Asia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Shop Name *
          </label>
          <Input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g. Rina's Handmade Clothes"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Business Type
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="">Select type (optional)</option>
            <option value="individual">Individual</option>
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="partnership">Partnership</option>
            <option value="corporation">Corporation</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Government ID *
          </label>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 py-8 text-center">
            <div>
              <p className="text-sm text-neutral-500">Upload ID document</p>
              <p className="text-xs text-neutral-400">(Requires Convex file storage)</p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700"
          disabled={isSubmitting || !shopName}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
