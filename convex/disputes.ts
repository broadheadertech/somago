import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuth, requireSeller, requireAdmin } from "./auth";
import { internal } from "./_generated/api";

// ── Buyer ──────────────────────────────────────────────────────
export const create = mutation({
  args: {
    orderId: v.id("orders"),
    issueType: v.union(
      v.literal("damaged"),
      v.literal("wrong_item"),
      v.literal("not_received")
    ),
    description: v.optional(v.string()),
    evidence: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const buyer = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.buyerId !== buyer._id) {
      throw new Error("Order not found");
    }

    // Check no existing open dispute
    const existing = await ctx.db
      .query("disputes")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "seller_responded"),
          q.eq(q.field("status"), "escalated")
        )
      )
      .first();
    if (existing) {
      throw new Error("A dispute is already open for this order");
    }

    const disputeId = await ctx.db.insert("disputes", {
      orderId: args.orderId,
      buyerId: buyer._id,
      sellerId: order.sellerId,
      issueType: args.issueType,
      description: args.description,
      evidence: args.evidence,
      status: "open",
      createdAt: Date.now(),
    });

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: order.sellerId,
      type: "dispute_update",
      title: "Buyer reported an issue",
      body: `A buyer reported "${args.issueType}" for order.`,
      data: { disputeId, orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    // Schedule auto-escalation after 48 hours
    await ctx.scheduler.runAfter(
      48 * 60 * 60 * 1000,
      internal.disputes.autoEscalate,
      { disputeId }
    );

    return disputeId;
  },
});

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();

    // Filter to user's own disputes unless admin
    if (user.role === "admin") return disputes;
    return disputes.filter(
      (d) => d.buyerId === user._id || d.sellerId === user._id
    );
  },
});

// ── Seller ─────────────────────────────────────────────────────
export const listSellerDisputes = query({
  args: {},
  handler: async (ctx) => {
    const seller = await requireSeller(ctx);
    return await ctx.db
      .query("disputes")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", seller._id))
      .order("desc")
      .collect();
  },
});

export const sellerRespond = mutation({
  args: {
    disputeId: v.id("disputes"),
    type: v.union(v.literal("replace"), v.literal("refund")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || dispute.sellerId !== seller._id) {
      throw new Error("Dispute not found");
    }
    if (dispute.status !== "open") {
      throw new Error("Dispute is no longer open for response");
    }

    await ctx.db.patch(args.disputeId, {
      status: "seller_responded",
      sellerResponse: {
        type: args.type,
        message: args.message,
      },
    });

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: dispute.buyerId,
      type: "dispute_update",
      title: "Seller responded to your report",
      body: `The seller offered a ${args.type} for your order.`,
      data: { disputeId: args.disputeId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── Buyer accept/reject seller offer ───────────────────────────
export const buyerDecision = mutation({
  args: {
    disputeId: v.id("disputes"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const buyer = await requireAuth(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || dispute.buyerId !== buyer._id) {
      throw new Error("Dispute not found");
    }
    if (dispute.status !== "seller_responded") {
      throw new Error("No seller response to accept or reject");
    }

    if (args.accept) {
      const resolution = dispute.sellerResponse!;
      await ctx.db.patch(args.disputeId, {
        status: "resolved",
        resolution: {
          type: resolution.type === "refund" ? "refund" : "replacement",
          reason: "Accepted by buyer",
        },
        resolvedAt: Date.now(),
      });

      // If refund, credit buyer balance
      if (resolution.type === "refund") {
        const order = await ctx.db.get(dispute.orderId);
        if (order) {
          await ctx.db.patch(buyer._id, {
            balance: (buyer.balance ?? 0) + order.totalAmount,
          });
          await ctx.db.patch(dispute.orderId, { paymentStatus: "refunded" });
        }
      }
    } else {
      // Escalate to admin
      await ctx.db.patch(args.disputeId, {
        status: "escalated",
        escalatedAt: Date.now(),
      });
    }
  },
});

// ── Auto-escalation (scheduled function) ───────────────────────
export const autoEscalate = internalMutation({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || dispute.status !== "open") return;

    await ctx.db.patch(args.disputeId, {
      status: "escalated",
      escalatedAt: Date.now(),
    });

    // Notify admins (find all admin users)
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "dispute_update",
        title: "Dispute auto-escalated",
        body: "A dispute was not resolved within 48 hours.",
        data: { disputeId: args.disputeId },
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

// ── Admin ──────────────────────────────────────────────────────
export const listEscalated = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "escalated"))
      .collect();
  },
});

export const resolve = mutation({
  args: {
    disputeId: v.id("disputes"),
    type: v.union(
      v.literal("refund"),
      v.literal("replacement"),
      v.literal("rejected")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    const order = await ctx.db.get(dispute.orderId);

    await ctx.db.patch(args.disputeId, {
      status: args.type === "rejected" ? "rejected" : "resolved",
      resolution: {
        type: args.type,
        amount: args.type === "refund" && order ? order.totalAmount : undefined,
        reason: args.reason,
        resolvedBy: admin._id,
      },
      resolvedAt: Date.now(),
    });

    // If refund, credit buyer
    if (args.type === "refund" && order) {
      const buyer = await ctx.db.get(dispute.buyerId);
      if (buyer) {
        await ctx.db.patch(dispute.buyerId, {
          balance: (buyer.balance ?? 0) + order.totalAmount,
        });
        await ctx.db.patch(dispute.orderId, { paymentStatus: "refunded" });
      }
    }

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: dispute.buyerId,
      type: "dispute_update",
      title: `Dispute ${args.type === "rejected" ? "rejected" : "resolved"}`,
      body:
        args.type === "refund"
          ? `Refund of ₱${order?.totalAmount ?? 0} credited to your balance.`
          : args.type === "replacement"
            ? "A replacement will be shipped."
            : `Your dispute was rejected: ${args.reason ?? "No reason provided."}`,
      data: { disputeId: args.disputeId },
      isRead: false,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: `dispute_${args.type}`,
      targetType: "dispute",
      targetId: args.disputeId,
      details: args.reason,
      createdAt: Date.now(),
    });
  },
});
