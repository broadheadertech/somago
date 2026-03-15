// @ts-nocheck
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

// ── Queries ───────────────────────────────────────────────────

export const getMyPoints = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    return user.loyaltyPoints ?? 0;
  },
});

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const earnPoints = internalMutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    orderTotal: v.number(),
  },
  handler: async (ctx, args) => {
    // Idempotency: check if points already awarded for this order
    const existing = await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();
    if (existing) return; // Already awarded

    // 1 point per ₱10 spent
    const pointsEarned = Math.floor(args.orderTotal / 10);
    if (pointsEarned <= 0) return;

    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Update user's loyalty points
    await ctx.db.patch(user._id, {
      loyaltyPoints: (user.loyaltyPoints ?? 0) + pointsEarned,
    });

    // Record transaction
    await ctx.db.insert("pointTransactions", {
      userId: user._id,
      points: pointsEarned,
      type: "earned",
      description: `Earned from order #${String(args.orderId).slice(-8).toUpperCase()}`,
      orderId: args.orderId,
      createdAt: Date.now(),
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "promotion",
      title: "Loyalty Points Earned!",
      body: `You earned ${pointsEarned} loyalty points from your order.`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const redeemPoints = mutation({
  args: { points: v.number() },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (args.points < 100) {
      throw new Error("Minimum 100 points required to redeem");
    }

    const currentPoints = user.loyaltyPoints ?? 0;
    if (currentPoints < args.points) {
      throw new Error("Insufficient loyalty points");
    }

    // Must redeem in multiples of 100
    const redeemablePoints = Math.floor(args.points / 100) * 100;
    // 100 points = ₱10
    const discount = (redeemablePoints / 100) * 10;

    // Deduct points
    await ctx.db.patch(user._id, {
      loyaltyPoints: currentPoints - redeemablePoints,
      balance: (user.balance ?? 0) + discount,
    });

    // Record transaction
    await ctx.db.insert("pointTransactions", {
      userId: user._id,
      points: -redeemablePoints,
      type: "redeemed",
      description: `Redeemed ${redeemablePoints} points for ₱${discount} balance`,
      createdAt: Date.now(),
    });

    return { pointsRedeemed: redeemablePoints, balanceAdded: discount };
  },
});
