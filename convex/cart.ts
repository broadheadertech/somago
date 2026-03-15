import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const items = await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product: product
            ? {
                _id: product._id,
                name: product.name,
                price: product.price,
                images: product.images,
                imageUrl: product.imageUrl,
                stock: product.stock,
                status: product.status,
                sellerId: product.sellerId,
                variants: product.variants,
              }
            : null,
        };
      })
    );

    return enriched.filter((item) => item.product !== null);
  },
});

export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const items = await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
});

export const add = mutation({
  args: {
    productId: v.id("products"),
    variantIndex: v.optional(v.number()),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || product.status !== "active") {
      throw new Error("Product not available");
    }

    // Check if already in cart
    const existing = await ctx.db
      .query("cart")
      .withIndex("by_userId_productId", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .filter((q) =>
        args.variantIndex !== undefined
          ? q.eq(q.field("variantIndex"), args.variantIndex)
          : q.eq(q.field("variantIndex"), undefined)
      )
      .first();

    if (existing) {
      const newQty = existing.quantity + args.quantity;
      if (newQty > product.stock) {
        throw new Error("Not enough stock available");
      }
      await ctx.db.patch(existing._id, { quantity: newQty });
      return existing._id;
    }

    if (args.quantity > product.stock) {
      throw new Error("Not enough stock available");
    }

    return await ctx.db.insert("cart", {
      userId: user._id,
      productId: args.productId,
      variantIndex: args.variantIndex,
      quantity: args.quantity,
    });
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cart"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const item = await ctx.db.get(args.cartItemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Cart item not found");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
      return;
    }

    const product = await ctx.db.get(item.productId);
    if (product && args.quantity > product.stock) {
      throw new Error("Not enough stock available");
    }

    await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
  },
});

export const remove = mutation({
  args: { cartItemId: v.id("cart") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const item = await ctx.db.get(args.cartItemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Cart item not found");
    }
    await ctx.db.delete(args.cartItemId);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMutationAuth(ctx);
    const items = await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});
