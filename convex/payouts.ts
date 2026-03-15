import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

const COMMISSION_RATE = 0.05; // 5% platform commission

export const getSellerPayoutSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (user.role !== "seller" && user.role !== "admin") return null;

    // Get all delivered orders for this seller
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const deliveredOrders = orders.filter(
      (o) => o.orderStatus === "delivered"
    );

    // Get all payouts for this seller
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const completedPayouts = payouts.filter(
      (p) => p.status === "completed" || p.status === "processing"
    );
    const totalPaid = completedPayouts.reduce(
      (sum, p) => sum + p.netAmount,
      0
    );
    const totalCommission = completedPayouts.reduce(
      (sum, p) => sum + p.commission,
      0
    );

    // Calculate total delivered earnings
    const totalDeliveredEarnings = deliveredOrders.reduce(
      (sum, o) => sum + (o.finalTotal ?? o.totalAmount),
      0
    );

    // Pending = total delivered - total paid out (gross)
    const totalPaidGross = completedPayouts.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const pendingGross = Math.max(0, totalDeliveredEarnings - totalPaidGross);
    const pendingCommission = pendingGross * COMMISSION_RATE;
    const pendingEarnings = pendingGross - pendingCommission;

    return {
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      pendingGross: Math.round(pendingGross * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      deliveredOrdersCount: deliveredOrders.length,
      commissionRate: COMMISSION_RATE,
    };
  },
});

export const getPayoutHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (user.role !== "seller" && user.role !== "admin") return [];

    return await ctx.db
      .query("payouts")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();
  },
});

export const requestPayout = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMutationAuth(ctx);
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Seller access required");
    }

    // Calculate pending earnings
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const deliveredOrders = orders.filter(
      (o) => o.orderStatus === "delivered"
    );

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const completedPayouts = payouts.filter(
      (p) => p.status === "completed" || p.status === "processing"
    );
    const totalPaidGross = completedPayouts.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const totalDeliveredEarnings = deliveredOrders.reduce(
      (sum, o) => sum + (o.finalTotal ?? o.totalAmount),
      0
    );

    const pendingGross = Math.max(0, totalDeliveredEarnings - totalPaidGross);
    const commission = pendingGross * COMMISSION_RATE;
    const netAmount = pendingGross - commission;

    if (netAmount < 500) {
      throw new Error(
        `Minimum payout is ₱500. Your pending earnings are ₱${netAmount.toFixed(2)}.`
      );
    }

    // Check for pending payout already in progress
    const pendingPayout = payouts.find((p) => p.status === "pending" || p.status === "processing");
    if (pendingPayout) {
      throw new Error("You already have a payout request being processed.");
    }

    const now = Date.now();

    // Count orders since last completed payout
    const lastPayout = completedPayouts.sort((a, b) => b.createdAt - a.createdAt)[0];
    const ordersIncluded = lastPayout
      ? deliveredOrders.filter((o) => o.createdAt > lastPayout.periodEnd).length
      : deliveredOrders.length;

    const payoutId = await ctx.db.insert("payouts", {
      sellerId: user._id,
      amount: Math.round(pendingGross * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      status: "pending",
      periodStart: completedPayouts.length > 0
        ? Math.max(...completedPayouts.map((p) => p.periodEnd))
        : deliveredOrders.length > 0
          ? Math.min(...deliveredOrders.map((o) => o.createdAt))
          : now,
      periodEnd: now,
      ordersIncluded: Math.max(0, ordersIncluded),
      createdAt: now,
    });

    return payoutId;
  },
});
