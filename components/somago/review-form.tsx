// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewFormProps {
  productId: string;
  orderId: string;
  productName: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, orderId, productName, onSubmitted }: ReviewFormProps) {
  const submitReview = useMutation(api.reviews.create);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitReview({
        productId: productId as any,
        orderId: orderId as any,
        rating,
        text: text || undefined,
      });
      toast.success("Review submitted!");
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">
        Review: {productName}
      </h3>

      {/* Star Selection */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={`h-7 w-7 ${star <= rating ? "text-accent-yellow" : "text-neutral-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience with this product..."
        rows={3}
      />

      <Button
        className="w-full bg-primary-600 hover:bg-primary-700"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
