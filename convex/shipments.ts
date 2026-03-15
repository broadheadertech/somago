import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

const CARRIER_PREFIXES: Record<string, string> = {
  jt_express: "JT",
  lbc: "LBC",
  grab_express: "GRB",
  manual: "MNL",
};

function generateTrackingNumber(carrier: string): string {
  const prefix = CARRIER_PREFIXES[carrier] ?? "TRK";
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}${ts}${rand}`;
}

export const createShipment = mutation({
  args: {
    orderId: v.id("orders"),
    carrier: v.union(
      v.literal("jt_express"),
      v.literal("lbc"),
      v.literal("grab_express"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    if (order.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    // Check if shipment already exists
    const existing = await ctx.db
      .query("shipments")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing) throw new Error("Shipment already exists for this order");

    const trackingNumber = generateTrackingNumber(args.carrier);
    const now = Date.now();

    // Estimate delivery: 3-7 days from now
    const estimatedDays = args.carrier === "grab_express" ? 2 : args.carrier === "jt_express" ? 4 : 5;
    const estimatedDelivery = now + estimatedDays * 24 * 60 * 60 * 1000;

    const shipmentId = await ctx.db.insert("shipments", {
      orderId: args.orderId,
      carrier: args.carrier,
      trackingNumber,
      status: "created",
      estimatedDelivery,
      events: [
        {
          status: "Shipment created",
          location: "Seller warehouse",
          timestamp: now,
        },
      ],
      createdAt: now,
    });

    // Update order with tracking number and status
    await ctx.db.patch(args.orderId, {
      trackingNumber,
      orderStatus: "shipped",
    });

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: order.buyerId,
      type: "order_update",
      title: "Order Shipped!",
      body: `Your order has been shipped via ${args.carrier.replace("_", " ").toUpperCase()}. Tracking: ${trackingNumber}`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: now,
    });

    return { shipmentId, trackingNumber };
  },
});

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const shipment = await ctx.db
      .query("shipments")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    return shipment;
  },
});

export const trackByNumber = query({
  args: { trackingNumber: v.string() },
  handler: async (ctx, args) => {
    const shipment = await ctx.db
      .query("shipments")
      .withIndex("by_trackingNumber", (q) =>
        q.eq("trackingNumber", args.trackingNumber)
      )
      .first();

    if (!shipment) return null;

    return {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      events: shipment.events,
      createdAt: shipment.createdAt,
    };
  },
});

export const updateStatus = mutation({
  args: {
    shipmentId: v.id("shipments"),
    status: v.union(
      v.literal("created"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    const order = await ctx.db.get(shipment.orderId);
    if (!order) throw new Error("Order not found");

    if (order.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    const statusLabels: Record<string, string> = {
      created: "Shipment created",
      picked_up: "Package picked up by carrier",
      in_transit: "Package in transit",
      out_for_delivery: "Out for delivery",
      delivered: "Package delivered",
      failed: "Delivery failed",
    };

    const newEvent = {
      status: statusLabels[args.status] ?? args.status,
      location: args.location,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.shipmentId, {
      status: args.status,
      events: [...shipment.events, newEvent],
    });

    // If delivered, update order status too
    if (args.status === "delivered") {
      await ctx.db.patch(shipment.orderId, { orderStatus: "delivered" });
    }

    return { success: true };
  },
});
