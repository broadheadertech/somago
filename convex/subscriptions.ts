// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

const PLANS = {
  free: { commission: 0.05, price: 0 },
  premium: { commission: 0.03, price: 999 },
  enterprise: { commission: 0.02, price: 4999 },
};

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return {
      plan: user.subscriptionPlan || "free",
      commissionRate: user.commissionRate ?? 0.05,
      expiresAt: user.subscriptionExpiresAt,
      isActive:
        user.subscriptionPlan === "free" ||
        (user.subscriptionExpiresAt && user.subscriptionExpiresAt > Date.now()),
    };
  },
});

export const subscribe = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("premium"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller" || user.sellerStatus !== "approved")
      throw new Error("Seller access required");

    const planConfig = PLANS[args.plan];
    if (!planConfig) throw new Error("Invalid plan");

    // Prevent duplicate subscribe to same plan
    if (user.subscriptionPlan === args.plan && args.plan !== "free") {
      if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > Date.now()) {
        throw new Error("Already subscribed to this plan");
      }
    }

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    if (args.plan === "free") {
      await ctx.db.patch(user._id, {
        subscriptionPlan: "free",
        commissionRate: 0.05,
        subscriptionExpiresAt: undefined,
      });
      return;
    }

    // Create payment record
    await ctx.db.insert("subscriptionPayments", {
      sellerId: user._id,
      plan: args.plan,
      amount: planConfig.price,
      currency: "PHP",
      status: "active",
      startsAt: now,
      expiresAt: now + oneMonth,
      createdAt: now,
    });

    // Update user
    await ctx.db.patch(user._id, {
      subscriptionPlan: args.plan,
      commissionRate: planConfig.commission,
      subscriptionExpiresAt: now + oneMonth,
    });
  },
});

export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller") throw new Error("Seller access required");

    // Mark current payment as cancelled
    const activePayment = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .first();

    if (activePayment && activePayment.status === "active") {
      await ctx.db.patch(activePayment._id, { status: "cancelled" });
    }

    await ctx.db.patch(user._id, {
      subscriptionPlan: "free",
      commissionRate: 0.05,
      subscriptionExpiresAt: undefined,
    });
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(50);
  },
});

export const adminListSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const payments = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);

    const enriched = await Promise.all(
      payments.map(async (p) => {
        const seller = await ctx.db.get(p.sellerId);
        return {
          ...p,
          sellerName: seller?.shopProfile?.shopName || seller?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});
