import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, requireSeller, requireAdmin } from "./auth";

// ── Buyer Queries ──────────────────────────────────────────────
export const listMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Only buyer, seller, or admin can view
    if (
      order.buyerId !== user._id &&
      order.sellerId !== user._id &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }
    return order;
  },
});

// ── Buyer Mutations ────────────────────────────────────────────
export const create = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        productImage: v.optional(v.id("_storage")),
        variantLabel: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
      })
    ),
    sellerId: v.id("users"),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      province: v.string(),
      postalCode: v.string(),
    }),
    paymentMethod: v.union(
      v.literal("cod"),
      v.literal("gcash"),
      v.literal("maya"),
      v.literal("card")
    ),
  },
  handler: async (ctx, args) => {
    const buyer = await requireAuth(ctx);

    const totalAmount = args.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Validate stock and decrement
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product || product.status !== "active") {
        throw new Error(`Product ${item.productName} is no longer available`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${item.productName}`);
      }
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
        soldCount: product.soldCount + item.quantity,
      });
    }

    const orderId = await ctx.db.insert("orders", {
      buyerId: buyer._id,
      sellerId: args.sellerId,
      items: args.items,
      totalAmount,
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentMethod === "cod" ? "pending" : "pending",
      orderStatus: "pending",
      createdAt: Date.now(),
    });

    // Create notification for seller
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "new_order",
      title: "New Order!",
      body: `You received a new order for ₱${totalAmount.toLocaleString()}`,
      data: { orderId },
      isRead: false,
      createdAt: Date.now(),
    });

    // Clear buyer's cart items for these products
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_userId", (q) => q.eq("userId", buyer._id))
      .collect();

    const orderedProductIds = new Set(args.items.map((i) => i.productId));
    for (const cartItem of cartItems) {
      if (orderedProductIds.has(cartItem.productId)) {
        await ctx.db.delete(cartItem._id);
      }
    }

    return orderId;
  },
});

// ── Seller Queries ─────────────────────────────────────────────
export const listSellerOrders = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("packed"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", seller._id))
      .order("desc")
      .collect();

    if (args.status) {
      return orders.filter((o) => o.orderStatus === args.status);
    }
    return orders;
  },
});

// ── Seller Mutations ───────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Seller or admin can update
    if (order.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    const updates: Record<string, unknown> = {
      orderStatus: args.status,
    };

    if (args.trackingNumber) {
      updates.trackingNumber = args.trackingNumber;
    }

    if (args.status === "delivered" && order.paymentMethod === "cod") {
      updates.paymentStatus = "paid";
    }

    await ctx.db.patch(args.orderId, updates);

    // Notify buyer
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed by the seller",
      packed: "Your order has been packed and is ready to ship",
      shipped: "Your order has been shipped!",
      delivered: "Your order has been delivered",
      cancelled: "Your order has been cancelled",
    };

    await ctx.db.insert("notifications", {
      userId: order.buyerId,
      type: "order_update",
      title: `Order ${args.status}`,
      body: statusMessages[args.status] ?? `Order status: ${args.status}`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── Admin Queries ──────────────────────────────────────────────
export const listAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("packed"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_orderStatus", (q) => q.eq("orderStatus", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});
