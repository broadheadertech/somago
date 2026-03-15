// @ts-nocheck
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StarRating } from "@/components/somago/star-rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageGallery } from "@/components/somago/image-gallery";
import { ProductCard } from "@/components/somago/product-card";
import { useCompare } from "@/lib/compare";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = useQuery(api.products.getById, { productId: id as any });
  const seller = useQuery(
    api.users.getSellerProfile,
    product?.sellerId ? { sellerId: product.sellerId } : "skip"
  );
  const sellerBadge = useQuery(
    api.users.getSellerBadge,
    product?.sellerId ? { sellerId: product.sellerId } : "skip"
  );
  const reviews = useQuery(
    api.reviews.getByProduct,
    product ? { productId: id as any, limit: 10 } : "skip"
  );
  const isWishlisted = useQuery(
    api.wishlist.isWishlisted,
    product ? { productId: id as any } : "skip"
  );
  const { isSignedIn } = useAuth();
  const reviewableOrder = useQuery(
    api.orders.getReviewableOrder,
    isSignedIn && product ? { productId: id as any } : "skip"
  );
  const toggleWishlist = useMutation(api.wishlist.toggle);
  const addToCart = useMutation(api.cart.add);
  const submitReview = useMutation(api.reviews.create);
  const getOrCreateConversation = useMutation(api.chat.getOrCreateConversation);
  const recommendations = useQuery(
    api.products.getRecommendations,
    product && product._id ? { productId: product._id, limit: 6 } : "skip"
  );
  const questions = useQuery(
    api.questions.getByProduct,
    product ? { productId: id as any } : "skip"
  );
  const askQuestion = useMutation(api.questions.ask);
  const answerQuestion = useMutation(api.questions.answer);
  const isFollowingSeller = useQuery(
    api.follows.isFollowing,
    isSignedIn && product?.sellerId ? { sellerId: product.sellerId } : "skip"
  );
  const toggleFollow = useMutation(api.follows.toggle);
  const createPriceAlert = useMutation(api.priceAlerts.create);

  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();

  // Computed variant price/stock for popup display
  const selectedVariantOption = selectedVariant !== undefined
    ? product?.variants?.[0]?.options?.[selectedVariant]
    : undefined;
  const selectedVariantPrice = selectedVariantOption?.price;
  const selectedVariantStock = selectedVariantOption?.stock;
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewVideoUrl, setReviewVideoUrl] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [isSavingAlert, setIsSavingAlert] = useState(false);
  const { addToCompare, compareIds } = useCompare();

  // Track recently viewed product
  useEffect(() => {
    if (id) {
      addRecentlyViewed(id);
    }
  }, [id]);

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-4">
        <Skeleton className="mb-4 aspect-square w-full rounded-xl" />
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-2 h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Product not found</h1>
        <p className="mt-2 text-neutral-500">This product may have been removed.</p>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Variant popup state
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [popupMode, setPopupMode] = useState<"cart" | "buy">("cart");

  // Lock body scroll when popup is open
  useEffect(() => {
    if (showVariantPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showVariantPopup]);

  const openVariantPopup = (mode: "cart" | "buy") => {
    if (!isSignedIn) {
      toast.error("Please sign in first to continue", {
        action: { label: "Sign In", onClick: () => router.push("/sign-in") },
      });
      return;
    }
    // Always show popup (like Shopee) — for variant selection + quantity
    setPopupMode(mode);
    setShowVariantPopup(true);
  };

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in first", {
        action: { label: "Sign In", onClick: () => router.push("/sign-in") },
      });
      return;
    }
    setIsAdding(true);
    try {
      await addToCart({
        productId: product._id,
        variantIndex: selectedVariant,
        quantity,
      });
      toast.success("Added to cart!");
      setShowVariantPopup(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in first", {
        action: { label: "Sign In", onClick: () => router.push("/sign-in") },
      });
      return;
    }
    setIsAdding(true);
    try {
      await addToCart({
        productId: product._id,
        variantIndex: selectedVariant,
        quantity,
      });
      setShowVariantPopup(false);
      router.push("/checkout");
    } catch (e: any) {
      toast.error(e.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-40">
      {/* Product Image Gallery */}
      <div className="mb-4">
        <ImageGallery
          images={[
            ...(product.imageUrls ?? []),
            ...(product.imageUrl && !product.imageUrls?.includes(product.imageUrl) ? [product.imageUrl] : []),
          ].filter(Boolean)}
          alt={product.name}
        />
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary-600">
            ₱{product.price.toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-base text-neutral-500 line-through">
              ₱{product.originalPrice.toLocaleString()}
            </span>
          )}
          {discount && (
            <Badge className="bg-accent-orange text-white">-{discount}%</Badge>
          )}
        </div>

        {/* Price Drop Alert */}
        {isSignedIn && (
          <div>
            {!showPriceAlert ? (
              <button
                onClick={() => setShowPriceAlert(true)}
                className="text-xs text-primary-600 hover:underline"
              >
                Notify me when price drops
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Target price"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="h-8 w-32 text-sm"
                />
                <Button
                  size="sm"
                  className="h-8 bg-primary-600 hover:bg-primary-700 text-xs"
                  disabled={isSavingAlert || !targetPrice}
                  onClick={async () => {
                    setIsSavingAlert(true);
                    try {
                      await createPriceAlert({
                        productId: product._id,
                        targetPrice: parseFloat(targetPrice),
                      });
                      toast.success("Price alert set!");
                      setShowPriceAlert(false);
                      setTargetPrice("");
                    } catch (e: any) {
                      toast.error(e.message || "Failed to set alert");
                    } finally {
                      setIsSavingAlert(false);
                    }
                  }}
                >
                  {isSavingAlert ? "..." : "Set Alert"}
                </Button>
                <button
                  onClick={() => { setShowPriceAlert(false); setTargetPrice(""); }}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <h1 className="text-lg font-semibold text-neutral-900">{product.name}</h1>

        {/* Rating & Sold */}
        <div className="flex items-center gap-3">
          <StarRating rating={product.rating} size="md" showValue />
          <span className="text-sm text-neutral-500">
            {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
          </span>
          <span className="text-sm text-neutral-500">
            {product.soldCount.toLocaleString()} sold
          </span>
        </div>

        <Separator />

        {/* Seller Info */}
        {seller && (
          <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
              {seller.shopProfile?.shopName?.charAt(0) || seller.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">
                  {seller.shopProfile?.shopName || seller.name}
                </p>
                {sellerBadge?.badge === "top_seller" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top Seller
                  </span>
                )}
                {sellerBadge?.badge === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {sellerBadge?.badge === "new" && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                    New Seller
                  </span>
                )}
              </div>
            </div>
            {/* Chat with Seller & Follow buttons */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isSignedIn && (
                <Button
                  variant={isFollowingSeller ? "outline" : "default"}
                  size="sm"
                  className={isFollowingSeller ? "border-primary-500 text-primary-600" : "bg-primary-600 hover:bg-primary-700"}
                  disabled={isTogglingFollow}
                  onClick={async () => {
                    setIsTogglingFollow(true);
                    try {
                      const result = await toggleFollow({ sellerId: product.sellerId });
                      toast.success(result.following ? "Following!" : "Unfollowed");
                    } catch (e: any) {
                      toast.error(e.message || "Failed");
                    } finally {
                      setIsTogglingFollow(false);
                    }
                  }}
                >
                  {isTogglingFollow ? "..." : isFollowingSeller ? "Following" : "+ Follow"}
                </Button>
              )}
              {isSignedIn && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-500 text-primary-600 hover:bg-primary-50"
                  disabled={isStartingChat}
                  onClick={async () => {
                    setIsStartingChat(true);
                    try {
                      const conversationId = await getOrCreateConversation({
                        sellerId: product.sellerId,
                        productId: product._id,
                      });
                      router.push(`/chat/${conversationId}`);
                    } catch (e: any) {
                      toast.error(e.message || "Failed to start chat");
                    } finally {
                      setIsStartingChat(false);
                    }
                  }}
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isStartingChat ? "..." : "Chat"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={async () => {
            const shareData = {
              title: product.name,
              text: `Check out ${product.name} on Somago!`,
              url: window.location.href,
            };
            if (navigator.share) {
              try {
                await navigator.share(shareData);
              } catch {}
            } else {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              } catch {
                toast.error("Failed to copy link");
              }
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>

        {/* Compare Button */}
        <button
          onClick={() => {
            const result = addToCompare(product._id);
            if (result === -1) {
              toast.error("Compare list is full (max 3 products)");
            } else if (result === compareIds.length) {
              toast("Already in compare list");
            } else {
              toast(
                <span>
                  Added to compare ({result}/3).{" "}
                  <Link href="/compare" className="font-medium text-primary-600 underline">
                    Compare now →
                  </Link>
                </span>
              );
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Compare
        </button>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            {product.variants.map((variant, vi) => (
              <div key={vi}>
                <p className="mb-1 text-sm font-medium text-neutral-700">{variant.name}</p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((option, oi) => (
                    <button
                      key={oi}
                      onClick={() => setSelectedVariant(oi)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        selectedVariant === oi
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-border text-neutral-700 hover:border-primary-300"
                      } ${option.stock === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                      disabled={option.stock === 0}
                    >
                      {option.label}
                      {option.price && (
                        <span className="ml-1 text-xs text-neutral-500">
                          ₱{option.price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-700">Quantity</span>
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              -
            </button>
            <span className="min-w-[2rem] text-center text-sm">{quantity}</span>
            <button
              onClick={() => {
                const maxStock = selectedVariant !== undefined
                  ? (product.variants?.[0]?.options?.[selectedVariant]?.stock ?? product.stock)
                  : product.stock;
                setQuantity(Math.min(maxStock, quantity + 1));
              }}
              className="px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              +
            </button>
          </div>
          <span className="text-xs text-neutral-500">
            {selectedVariant !== undefined
              ? (product.variants?.[0]?.options?.[selectedVariant]?.stock ?? product.stock)
              : product.stock} available
          </span>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h2 className="mb-2 text-base font-semibold text-neutral-900">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {product.description}
          </p>
        </div>

        <Separator />

        {/* Reviews */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-neutral-900">
            Reviews ({product.reviewCount})
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs font-medium text-neutral-900">
                      {review.buyerName}
                    </span>
                    {review.isVerified && (
                      <span className="text-[10px] text-primary-600">Verified Purchase</span>
                    )}
                  </div>
                  {review.text && (
                    <p className="mt-1 text-sm text-neutral-700">{review.text}</p>
                  )}
                  {review.videoUrl && (
                    <div className="mt-2">
                      <video
                        src={review.videoUrl}
                        controls
                        preload="metadata"
                        className="w-full max-h-60 rounded-lg"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No reviews yet</p>
          )}

          {/* Review Submission Form */}
          {reviewableOrder && (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Write a Review</h3>
              <p className="mb-3 text-xs text-neutral-500">You purchased this item — share your experience!</p>

              {/* Star Selection */}
              <div className="mb-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-0.5"
                  >
                    <svg
                      className={`h-6 w-6 ${star <= reviewRating ? "text-accent-yellow" : "text-neutral-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="ml-2 text-xs text-neutral-500">{reviewRating}/5</span>
                )}
              </div>

              <Textarea
                placeholder="Tell others about your experience (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="mb-3 bg-white"
              />

              <Input
                placeholder="Video URL (optional, e.g. https://...)"
                value={reviewVideoUrl}
                onChange={(e) => setReviewVideoUrl(e.target.value.slice(0, 500))}
                maxLength={500}
                className="mb-3 bg-white"
              />

              <Button
                className="w-full bg-primary-600 hover:bg-primary-700"
                disabled={reviewRating === 0 || isSubmittingReview}
                onClick={async () => {
                  setIsSubmittingReview(true);
                  try {
                    await submitReview({
                      productId: product._id,
                      orderId: reviewableOrder._id,
                      rating: reviewRating,
                      text: reviewText || undefined,
                      videoUrl: reviewVideoUrl.trim() || undefined,
                    });
                    toast.success("Review submitted! Thank you.");
                    setReviewRating(0);
                    setReviewText("");
                    setReviewVideoUrl("");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to submit review");
                  } finally {
                    setIsSubmittingReview(false);
                  }
                }}
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Q&A Section */}
      <div className="mt-6">
        <Separator className="mb-4" />
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Questions & Answers
        </h2>

        {/* Ask a Question */}
        {isSignedIn && (
          <div className="mb-4 rounded-lg border border-border bg-neutral-50 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about this product..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value.slice(0, 500))}
                className="bg-white"
              />
              <Button
                className="shrink-0 bg-primary-600 hover:bg-primary-700"
                disabled={!questionText.trim() || isAskingQuestion}
                onClick={async () => {
                  setIsAskingQuestion(true);
                  try {
                    await askQuestion({ productId: product._id, question: questionText.trim() });
                    toast.success("Question posted!");
                    setQuestionText("");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to post question");
                  } finally {
                    setIsAskingQuestion(false);
                  }
                }}
              >
                {isAskingQuestion ? "Posting..." : "Ask"}
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-neutral-400">{questionText.length}/500</p>
          </div>
        )}

        {/* Questions List */}
        {questions && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q._id} className="rounded-lg border border-border bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm font-bold text-primary-600">Q:</span>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-900">{q.question}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      Asked by {q.askerName} on{" "}
                      {new Date(q.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {q.answer ? (
                  <div className="mt-2 flex items-start gap-2 rounded-md bg-primary-50 p-2">
                    <span className="mt-0.5 text-sm font-bold text-primary-700">A:</span>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-800">{q.answer}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        Answered by {q.answeredByName || "Seller"}
                        {q.answeredAt &&
                          ` on ${new Date(q.answeredAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {seller && product.sellerId === seller._id ? (
                      answeringId === q._id ? (
                        <div className="mt-2 flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Write your answer..."
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value.slice(0, 1000))}
                              className="bg-white"
                              maxLength={1000}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">{answerText.length}/1000</span>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 bg-primary-600 hover:bg-primary-700"
                            disabled={!answerText.trim() || isSubmittingAnswer}
                            onClick={async () => {
                              setIsSubmittingAnswer(true);
                              try {
                                await answerQuestion({ questionId: q._id, answer: answerText.trim() });
                                toast.success("Answer posted!");
                                setAnsweringId(null);
                                setAnswerText("");
                              } catch (e: any) {
                                toast.error(e.message || "Failed to post answer");
                              } finally {
                                setIsSubmittingAnswer(false);
                              }
                            }}
                          >
                            {isSubmittingAnswer ? "..." : "Submit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setAnsweringId(null); setAnswerText(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="mt-2 text-xs font-medium text-primary-600 hover:underline"
                          onClick={() => { setAnsweringId(q._id); setAnswerText(""); }}
                        >
                          Answer this question
                        </button>
                      )
                    ) : (
                      <p className="mt-2 text-xs italic text-neutral-400">
                        Waiting for seller&apos;s answer
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No questions yet. Be the first to ask!</p>
        )}
      </div>

      {/* You May Also Like */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-6">
          <Separator className="mb-4" />
          <h2 className="mb-3 text-base font-semibold text-neutral-900">
            You May Also Like
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recommendations.map((rec) => (
              <div key={rec._id} className="min-w-37.5 max-w-45 shrink-0">
                <ProductCard
                  id={rec._id}
                  name={rec.name}
                  price={rec.price}
                  originalPrice={rec.originalPrice}
                  imageUrl={rec.imageUrl ?? null}
                  rating={rec.rating}
                  reviewCount={rec.reviewCount}
                  soldCount={rec.soldCount}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-border bg-white p-3 md:bottom-0">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={async () => {
              if (!isSignedIn) {
                toast.error("Please sign in first", {
                  action: { label: "Sign In", onClick: () => router.push("/sign-in") },
                });
                return;
              }
              try {
                await toggleWishlist({ productId: product._id });
                toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
              } catch {
                toast.error("Failed to update wishlist");
              }
            }}
            className="rounded-lg border border-border p-2.5 transition-colors hover:bg-red-50"
          >
            <svg
              className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"}`}
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <Button
            variant="outline"
            className="flex-1 border-primary-500 text-primary-600 hover:bg-primary-50"
            onClick={() => openVariantPopup("cart")}
            disabled={isAdding || product.stock === 0}
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
          <Button
            className="flex-1 bg-primary-600 hover:bg-primary-700"
            disabled={isAdding || product.stock === 0}
            onClick={() => openVariantPopup("buy")}
          >
            {product.stock === 0 ? "Out of Stock" : "Buy Now"}
          </Button>
        </div>
      </div>

      {/* ── Variant Selector Popup (Shopee-style bottom sheet) ── */}
      {showVariantPopup && (
        <div className="fixed inset-0 z-60">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowVariantPopup(false)}
          />
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5 animate-in slide-in-from-bottom">
            {/* Close button */}
            <button
              onClick={() => setShowVariantPopup(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Product summary */}
            <div className="flex gap-3 mb-5 pr-8">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-primary-600">
                  ₱{(selectedVariantPrice ?? product.price).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500">
                  Stock: {selectedVariantStock ?? product.stock}
                </p>
                {selectedVariant !== undefined && product.variants?.[0] && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Selected: {product.variants[0].options[selectedVariant]?.label}
                  </p>
                )}
              </div>
            </div>

            {/* Variant selector */}
            {product.variants && product.variants.map((variant, vi) => (
              <div key={vi} className="mb-4">
                <p className="mb-2 text-sm font-semibold text-neutral-900">{variant.name}</p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((option, oi) => {
                    const isSelected = selectedVariant === oi;
                    const isOutOfStock = option.stock !== undefined && option.stock <= 0;
                    return (
                      <button
                        key={oi}
                        onClick={() => !isOutOfStock && setSelectedVariant(oi)}
                        disabled={isOutOfStock}
                        className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                          isSelected
                            ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                            : isOutOfStock
                              ? "border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed line-through"
                              : "border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                      >
                        {option.label}
                        {option.price && option.price !== product.price && (
                          <span className="ml-1 text-xs text-neutral-500">₱{option.price.toLocaleString()}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-semibold text-neutral-900">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariantStock ?? product.stock, quantity + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  +
                </button>
                <span className="text-xs text-neutral-500">
                  {selectedVariantStock ?? product.stock} available
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {popupMode === "cart" ? (
                <Button
                  className="flex-1 bg-primary-600 hover:bg-primary-700 h-12 text-base"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {isAdding ? "Adding..." : "Add to Cart"}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-primary-600 hover:bg-primary-700 h-12 text-base"
                  onClick={handleBuyNow}
                  disabled={isAdding}
                >
                  {isAdding ? "Processing..." : "Buy Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
