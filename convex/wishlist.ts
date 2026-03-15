import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMutationAuth, getCurrentUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      })
    );

    return enriched.filter((item) => item.product && item.product.status === "active");
  },
});

export const isWishlisted = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const item = await ctx.db
      .query("wishlist")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();
    return !!item;
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const existing = await ctx.db
      .query("wishlist")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("wishlist", {
      userId: user._id,
      productId: args.productId,
      createdAt: Date.now(),
    });
    return true;
  },
});
