import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMutationAuth, requireAdmin, getCurrentUser } from "./auth";
import { checkRateLimit } from "./rateLimit";
import { requireValidUrl } from "./utils";

export const getByProduct = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(limit);

    // Enrich with reviewer name
    return await Promise.all(
      reviews.map(async (review) => {
        const buyer = await ctx.db.get(review.buyerId);
        return {
          ...review,
          buyerName: buyer?.name ?? "Anonymous",
          buyerAvatar: buyer?.avatar,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    text: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    // Rate limit: max 10 reviews per hour
    const { allowed } = await checkRateLimit(ctx, user._id, "createReview", 10, 60 * 60 * 1000);
    if (!allowed) {
      throw new Error("You are posting reviews too quickly. Please try again later.");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    requireValidUrl(args.videoUrl, "video URL");

    // Verify the order exists, belongs to this buyer, and is delivered
    const order = await ctx.db.get(args.orderId);
    if (!order || order.buyerId !== user._id) {
      throw new Error("Order not found");
    }
    if (order.orderStatus !== "delivered") {
      throw new Error("Can only review delivered orders");
    }

    // Check not already reviewed
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();
    if (existing) {
      throw new Error("You already reviewed this product for this order");
    }

    await ctx.db.insert("reviews", {
      buyerId: user._id,
      productId: args.productId,
      orderId: args.orderId,
      rating: args.rating,
      text: args.text,
      photos: args.photos,
      videoUrl: args.videoUrl,
      isVerified: true,
      createdAt: Date.now(),
    });

    // Update product aggregated rating
    const product = await ctx.db.get(args.productId);
    if (product) {
      const newCount = product.reviewCount + 1;
      const newRating =
        (product.rating * product.reviewCount + args.rating) / newCount;
      await ctx.db.patch(args.productId, {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newCount,
      });
    }
  },
});

export const flag = mutation({
  args: {
    reviewId: v.id("reviews"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireMutationAuth(ctx);
    await ctx.db.patch(args.reviewId, { isFlagged: true });
  },
});

// ── Admin ──────────────────────────────────────────────────────
export const listFlagged = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const reviews = await ctx.db.query("reviews").collect();
    return reviews.filter((r) => r.isFlagged);
  },
});

export const moderateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    action: v.union(v.literal("approve"), v.literal("remove")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.action === "approve") {
      await ctx.db.patch(args.reviewId, { isFlagged: false });
    } else {
      const review = await ctx.db.get(args.reviewId);
      if (review) {
        // Update product aggregated rating
        const product = await ctx.db.get(review.productId);
        if (product && product.reviewCount > 1) {
          const newCount = product.reviewCount - 1;
          const newRating =
            (product.rating * product.reviewCount - review.rating) / newCount;
          await ctx.db.patch(review.productId, {
            rating: Math.round(newRating * 10) / 10,
            reviewCount: newCount,
          });
        } else if (product) {
          await ctx.db.patch(review.productId, { rating: 0, reviewCount: 0 });
        }
        await ctx.db.delete(args.reviewId);
      }
    }

    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: `review_${args.action}`,
      targetType: "review",
      targetId: args.reviewId,
      createdAt: Date.now(),
    });
  },
});
