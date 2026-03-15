import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

export const create = mutation({
  args: {
    productId: v.id("products"),
    targetPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (args.targetPrice <= 0) {
      throw new Error("Target price must be positive");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    if (args.targetPrice >= product.price) {
      throw new Error("Target price must be lower than current price");
    }
    if (args.targetPrice < 1) {
      throw new Error("Target price must be at least ₱1");
    }
    if (args.targetPrice < product.price * 0.1) {
      throw new Error("Target price must be at least 10% of current price");
    }

    // Check if user already has an active alert for this product
    const existing = await ctx.db
      .query("priceAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("productId"), args.productId),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existing) {
      // Update existing alert
      await ctx.db.patch(existing._id, {
        targetPrice: args.targetPrice,
        originalPrice: product.price,
      });
      return existing._id;
    }

    return await ctx.db.insert("priceAlerts", {
      userId: user._id,
      productId: args.productId,
      targetPrice: args.targetPrice,
      originalPrice: product.price,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const getMyAlerts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const alerts = await ctx.db
      .query("priceAlerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const product = await ctx.db.get(alert.productId);
        return {
          ...alert,
          productName: product?.name ?? "Unknown Product",
          productImage: product?.imageUrl,
          currentPrice: product?.price ?? 0,
          productStatus: product?.status,
        };
      })
    );

    return enriched;
  },
});

export const deleteAlert = mutation({
  args: { alertId: v.id("priceAlerts") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found");
    }
    await ctx.db.patch(args.alertId, { isActive: false });
  },
});

export const checkAlerts = internalMutation({
  args: {
    productId: v.id("products"),
    newPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("priceAlerts")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const product = await ctx.db.get(args.productId);
    const productName = product?.name ?? "A product";

    for (const alert of alerts) {
      if (args.newPrice <= alert.targetPrice) {
        // Send notification
        await ctx.db.insert("notifications", {
          userId: alert.userId,
          type: "promotion",
          title: "Price Drop Alert!",
          body: `${productName} dropped to ₱${args.newPrice.toLocaleString()} (your target: ₱${alert.targetPrice.toLocaleString()})`,
          data: { productId: args.productId },
          isRead: false,
          createdAt: Date.now(),
        });

        // Deactivate the alert
        await ctx.db.patch(alert._id, { isActive: false });
      }
    }
  },
});
