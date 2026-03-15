import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireSeller, getCurrentUser } from "./auth";

// ── Get Active Promotions (for home page boosting) ─────────────
export const getActivePromotions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const now = Date.now();

    const promotions = await ctx.db
      .query("promotedListings")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(50);

    // Filter to promotions within their date range and with remaining budget
    const active = promotions.filter(
      (p) => p.startAt <= now && p.endAt >= now && p.spent < p.budget
    );

    // Fetch associated products
    const results = await Promise.all(
      active.slice(0, limit).map(async (promo) => {
        const product = await ctx.db.get(promo.productId);
        if (!product || product.status !== "active") return null;
        return {
          promotionId: promo._id,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            imageUrl: product.imageUrl,
            rating: product.rating,
            reviewCount: product.reviewCount,
            soldCount: product.soldCount,
          },
        };
      })
    );

    return results.filter(Boolean);
  },
});

// ── Create Promotion ───────────────────────────────────────────
export const create = mutation({
  args: {
    productId: v.id("products"),
    budget: v.number(),
    costPerClick: v.number(),
    startAt: v.number(),
    endAt: v.number(),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);

    // Validate product belongs to seller
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== seller._id) {
      throw new Error("You can only promote your own products");
    }
    if (product.status !== "active") {
      throw new Error("Product must be active to promote");
    }

    // Validate budget & CPC
    if (args.budget < 50) throw new Error("Minimum budget is ₱50");
    if (args.costPerClick < 1) throw new Error("Minimum cost per click is ₱1");
    if (args.endAt <= args.startAt) throw new Error("End date must be after start date");

    return await ctx.db.insert("promotedListings", {
      sellerId: seller._id,
      productId: args.productId,
      budget: args.budget,
      spent: 0,
      costPerClick: args.costPerClick,
      clicks: 0,
      impressions: 0,
      isActive: true,
      startAt: args.startAt,
      endAt: args.endAt,
      createdAt: Date.now(),
    });
  },
});

// ── Record Click ───────────────────────────────────────────────
export const recordClick = mutation({
  args: { promotionId: v.id("promotedListings") },
  handler: async (ctx, args) => {
    // Re-fetch inside mutation for atomicity
    const promo = await ctx.db.get(args.promotionId);
    if (!promo || !promo.isActive) return;

    // Pre-check: if already at or over budget, deactivate and skip
    if (promo.spent >= promo.budget) {
      await ctx.db.patch(args.promotionId, { isActive: false });
      return;
    }

    const newSpent = promo.spent + promo.costPerClick;
    const newClicks = promo.clicks + 1;
    const budgetExhausted = newSpent >= promo.budget;

    // Cap spent at budget to prevent overspend
    await ctx.db.patch(args.promotionId, {
      clicks: newClicks,
      spent: Math.min(newSpent, promo.budget),
      isActive: !budgetExhausted,
    });
  },
});

// ── Get My Promotions ──────────────────────────────────────────
export const getMyPromotions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "seller" && user.role !== "admin")) return [];

    const promotions = await ctx.db
      .query("promotedListings")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    // Enrich with product info
    const enriched = await Promise.all(
      promotions.map(async (promo) => {
        const product = await ctx.db.get(promo.productId);
        return {
          ...promo,
          productName: product?.name ?? "Deleted product",
          productImage: product?.imageUrl,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});
