import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth, requireAdmin } from "./auth";

// ── Internal: Auto-check order for fraud ────────────────────────
export const checkOrder = internalMutation({
  args: {
    orderId: v.id("orders"),
    buyerId: v.id("users"),
    totalAmount: v.number(),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      province: v.string(),
      postalCode: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check 1: Unusually high order amount (> 50,000 PHP)
    if (args.totalAmount > 50000) {
      await ctx.db.insert("fraudFlags", {
        targetType: "order",
        targetId: args.orderId,
        reason: `Unusually high order amount: ₱${args.totalAmount.toLocaleString()}`,
        severity: args.totalAmount > 100000 ? "high" : "medium",
        status: "open",
        detectedBy: "system",
        createdAt: now,
      });
    }

    // Check 2: Same buyer placing > 5 orders in 1 hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
      .collect();

    if (recentOrders.length > 5) {
      await ctx.db.insert("fraudFlags", {
        targetType: "user",
        targetId: args.buyerId,
        reason: `Rapid ordering: ${recentOrders.length} orders in the last hour`,
        severity: "high",
        status: "open",
        detectedBy: "system",
        createdAt: now,
      });
    }

    // Check 3: Same address used by different accounts
    const allRecentOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);

    const sameAddressOrders = allRecentOrders.filter(
      (o) =>
        o.buyerId !== args.buyerId &&
        o.shippingAddress.addressLine1.toLowerCase() === args.shippingAddress.addressLine1.toLowerCase() &&
        o.shippingAddress.city.toLowerCase() === args.shippingAddress.city.toLowerCase() &&
        o.shippingAddress.postalCode === args.shippingAddress.postalCode
    );

    if (sameAddressOrders.length > 0) {
      const uniqueBuyers = new Set(sameAddressOrders.map((o) => o.buyerId));
      await ctx.db.insert("fraudFlags", {
        targetType: "order",
        targetId: args.orderId,
        reason: `Shipping address shared with ${uniqueBuyers.size} other account(s)`,
        severity: "medium",
        status: "open",
        detectedBy: "system",
        createdAt: now,
      });
    }
  },
});

// ── Admin: List fraud flags ──────────────────────────────────────
export const listFlags = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
    severity: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    let flags;
    if (args.status) {
      flags = await ctx.db
        .query("fraudFlags")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      flags = await ctx.db.query("fraudFlags").order("desc").collect();
    }

    if (args.severity) {
      flags = flags.filter((f) => f.severity === args.severity);
    }

    return flags;
  },
});

// ── Admin: Resolve/dismiss a flag ────────────────────────────────
export const resolveFlag = mutation({
  args: {
    flagId: v.id("fraudFlags"),
    action: v.union(v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const flag = await ctx.db.get(args.flagId);
    if (!flag) throw new Error("Flag not found");

    await ctx.db.patch(args.flagId, {
      status: args.action,
      resolvedBy: admin._id,
      resolvedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: `fraud_flag_${args.action}`,
      targetType: flag.targetType as any,
      targetId: flag.targetId,
      details: `Flag ${args.action}: ${flag.reason}`,
      createdAt: Date.now(),
    });
  },
});

// ── User: Report suspicious activity ─────────────────────────────
export const reportSuspicious = mutation({
  args: {
    targetType: v.union(
      v.literal("user"),
      v.literal("order"),
      v.literal("review"),
      v.literal("product")
    ),
    targetId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMutationAuth(ctx);

    if (!args.reason.trim()) {
      throw new Error("Please provide a reason");
    }

    await ctx.db.insert("fraudFlags", {
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason.trim(),
      severity: "low",
      status: "open",
      detectedBy: "user_report",
      createdAt: Date.now(),
    });
  },
});
