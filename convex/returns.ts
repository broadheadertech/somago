import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

export const requestReturn = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    if (order.buyerId !== user._id) {
      throw new Error("Access denied");
    }

    if (order.orderStatus !== "delivered") {
      throw new Error("Returns can only be requested for delivered orders");
    }

    // Check if return already exists
    const existing = await ctx.db
      .query("returns")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing) throw new Error("A return request already exists for this order");

    const refundAmount = order.finalTotal ?? order.totalAmount;

    const returnId = await ctx.db.insert("returns", {
      orderId: args.orderId,
      buyerId: user._id,
      sellerId: order.sellerId,
      reason: args.reason,
      status: "requested",
      refundAmount,
      createdAt: Date.now(),
    });

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: order.sellerId,
      type: "order_update",
      title: "Return Requested",
      body: `A buyer has requested a return for order #${args.orderId.slice(-8).toUpperCase()}. Reason: ${args.reason}`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    return returnId;
  },
});

export const approveReturn = mutation({
  args: { returnId: v.id("returns") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const returnDoc = await ctx.db.get(args.returnId);
    if (!returnDoc) throw new Error("Return not found");

    if (returnDoc.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    if (returnDoc.status !== "requested") {
      throw new Error("Return is not in requested status");
    }

    // Generate return shipping label (tracking number)
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    const returnTrackingNumber = `RTN${rand}`;

    await ctx.db.patch(args.returnId, {
      status: "approved",
      returnTrackingNumber,
    });

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: returnDoc.buyerId,
      type: "order_update",
      title: "Return Approved",
      body: `Your return has been approved. Ship the item back using tracking: ${returnTrackingNumber}`,
      data: { orderId: returnDoc.orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    return { returnTrackingNumber };
  },
});

export const updateReturnStatus = mutation({
  args: {
    returnId: v.id("returns"),
    status: v.union(
      v.literal("shipped_back"),
      v.literal("received"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const returnDoc = await ctx.db.get(args.returnId);
    if (!returnDoc) throw new Error("Return not found");

    if (
      returnDoc.sellerId !== user._id &&
      returnDoc.buyerId !== user._id &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.returnId, { status: args.status });

    // Notify the other party
    const notifyUserId =
      user._id === returnDoc.sellerId
        ? returnDoc.buyerId
        : returnDoc.sellerId;

    const statusMessages: Record<string, string> = {
      shipped_back: "The return item has been shipped back",
      received: "The seller has received the returned item",
      rejected: "Your return request has been rejected",
    };

    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: "order_update",
      title: "Return Update",
      body: statusMessages[args.status] ?? `Return status: ${args.status}`,
      data: { orderId: returnDoc.orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    // Permission check: only buyer, seller, or admin can view
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.buyerId !== user._id && order.sellerId !== user._id && user.role !== "admin") {
      return null;
    }

    return await ctx.db
      .query("returns")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

export const listSellerReturns = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (user.role !== "seller" && user.role !== "admin") return [];

    return await ctx.db
      .query("returns")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();
  },
});

export const completeReturn = mutation({
  args: { returnId: v.id("returns") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const returnDoc = await ctx.db.get(args.returnId);
    if (!returnDoc) throw new Error("Return not found");

    if (returnDoc.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    if (returnDoc.status !== "received") {
      throw new Error("Return must be in received status to complete");
    }

    // Re-fetch order for accurate refund amount
    const order = await ctx.db.get(returnDoc.orderId);
    const refundAmount = returnDoc.refundAmount ?? (order?.finalTotal ?? order?.totalAmount ?? 0);

    if (refundAmount <= 0) {
      throw new Error("Refund amount is invalid. Please contact support.");
    }

    // Check order not already refunded
    if (order?.paymentStatus === "refunded") {
      throw new Error("This order has already been refunded");
    }

    // Credit buyer balance
    const buyer = await ctx.db.get(returnDoc.buyerId);
    if (buyer) {
      await ctx.db.patch(returnDoc.buyerId, {
        balance: (buyer.balance ?? 0) + refundAmount,
      });
    }

    // Update return and order status
    await ctx.db.patch(args.returnId, { status: "refunded" });
    if (order) {
      await ctx.db.patch(returnDoc.orderId, { paymentStatus: "refunded" });
    }

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: returnDoc.buyerId,
      type: "order_update",
      title: "Refund Processed",
      body: `₱${refundAmount.toLocaleString()} has been refunded to your Somago Balance`,
      data: { orderId: returnDoc.orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
