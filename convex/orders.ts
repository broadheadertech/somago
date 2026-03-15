import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, requireMutationAuth, requireSeller, requireAdmin } from "./auth";

// ── Buyer Queries ──────────────────────────────────────────────
export const listMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

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
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Only buyer, seller, or admin can view
    if (
      order.buyerId !== user._id &&
      order.sellerId !== user._id &&
      user.role !== "admin"
    ) {
      return null;
    }

    // Enrich items with product imageUrl
    const enrichedItems = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, imageUrl: product?.imageUrl };
      })
    );

    return { ...order, items: enrichedItems };
  },
});

export const getReviewableOrder = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    // Find a delivered order containing this product that hasn't been reviewed yet
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id))
      .filter((q) => q.eq(q.field("orderStatus"), "delivered"))
      .collect();

    for (const order of orders) {
      const hasProduct = order.items.some((item) => item.productId === args.productId);
      if (!hasProduct) continue;

      // Check if already reviewed
      const existingReview = await ctx.db
        .query("reviews")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .filter((q) => q.eq(q.field("productId"), args.productId))
        .first();
      if (!existingReview) return order;
    }
    return null;
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
      v.literal("card"),
      v.literal("balance")
    ),
    shippingFee: v.optional(v.number()),
    voucherDiscount: v.optional(v.number()),
    voucherCode: v.optional(v.string()),
    voucherId: v.optional(v.id("vouchers")),
    tax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const buyer = await requireMutationAuth(ctx);

    // Validate prices against DB and derive sellerId from product
    let derivedSellerId: any = null;
    const validatedItems = [];

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product || product.status !== "active") {
        throw new Error(`Product ${item.productName} is no longer available`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${item.productName}`);
      }

      // Verify price matches DB (prevent price tampering)
      const dbPrice = item.variantLabel && product.variants?.[0]?.options
        ? (product.variants[0].options.find((o: any) => o.label === item.variantLabel)?.price ?? product.price)
        : product.price;

      if (Math.abs(item.unitPrice - dbPrice) > 0.01) {
        throw new Error(`Price mismatch for ${product.name}. Please refresh and try again.`);
      }

      // Derive sellerId from product (don't trust client)
      if (!derivedSellerId) {
        derivedSellerId = product.sellerId;
      } else if (derivedSellerId !== product.sellerId) {
        throw new Error("All items in an order must be from the same seller");
      }

      const newStock = product.stock - item.quantity;
      await ctx.db.patch(item.productId, {
        stock: newStock,
        soldCount: product.soldCount + item.quantity,
      });

      // Check low stock threshold and notify seller
      const seller = await ctx.db.get(product.sellerId);
      const threshold = seller?.lowStockThreshold ?? 5;
      if (newStock <= threshold && newStock >= 0) {
        await ctx.db.insert("notifications", {
          userId: product.sellerId,
          type: "system",
          title: "Low Stock Alert",
          body: `"${product.name}" is running low (${newStock} left). Restock soon!`,
          data: { productId: item.productId },
          isRead: false,
          createdAt: Date.now(),
        });
      }

      // Check and enforce flash sale stock limits
      const flashSale = await ctx.db
        .query("flashSales")
        .withIndex("by_productId", (q) => q.eq("productId", item.productId))
        .filter((q) =>
          q.and(
            q.eq(q.field("isActive"), true),
            q.lte(q.field("startAt"), Date.now()),
            q.gte(q.field("endAt"), Date.now())
          )
        )
        .first();

      if (flashSale) {
        if (flashSale.stockLimit && flashSale.soldCount + item.quantity > flashSale.stockLimit) {
          throw new Error(`Flash sale limit reached for ${product.name}`);
        }
        await ctx.db.patch(flashSale._id, {
          soldCount: flashSale.soldCount + item.quantity,
        });
      }

      validatedItems.push({ ...item, unitPrice: dbPrice });
    }

    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const shippingFee = args.shippingFee ?? 0;
    const voucherDiscount = args.voucherDiscount ?? 0;
    const tax = args.tax ?? 0;
    const finalTotal = Math.max(0, totalAmount - voucherDiscount + shippingFee + tax);

    // Handle balance payment
    let paymentStatus: "pending" | "paid" | "failed" | "refunded" = "pending";
    if (args.paymentMethod === "balance") {
      const buyerBalance = buyer.balance ?? 0;
      if (buyerBalance < finalTotal) {
        throw new Error("Insufficient Somago Balance. Please choose another payment method.");
      }
      // Deduct from buyer balance
      await ctx.db.patch(buyer._id, {
        balance: buyerBalance - finalTotal,
      });
      paymentStatus = "paid";
    }

    const orderId = await ctx.db.insert("orders", {
      buyerId: buyer._id,
      sellerId: derivedSellerId,
      items: validatedItems,
      totalAmount,
      shippingFee: shippingFee > 0 ? shippingFee : undefined,
      voucherDiscount: voucherDiscount > 0 ? voucherDiscount : undefined,
      voucherCode: args.voucherCode,
      tax: tax > 0 ? tax : undefined,
      finalTotal,
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod,
      paymentStatus,
      orderStatus: "pending",
      createdAt: Date.now(),
    });

    // Apply voucher atomically (within same mutation = same transaction)
    if (args.voucherId && voucherDiscount > 0) {
      const voucher = await ctx.db.get(args.voucherId);
      if (voucher && voucher.isActive) {
        // Check not already used by this user
        const alreadyUsed = await ctx.db
          .query("voucherUsage")
          .withIndex("by_userId", (q) => q.eq("userId", buyer._id))
          .filter((q) => q.eq(q.field("voucherId"), args.voucherId))
          .first();
        if (!alreadyUsed) {
          await ctx.db.insert("voucherUsage", {
            voucherId: args.voucherId,
            userId: buyer._id,
            orderId,
            discount: voucherDiscount,
            createdAt: Date.now(),
          });
          await ctx.db.patch(args.voucherId, {
            usedCount: voucher.usedCount + 1,
          });
        }
      }
    }

    // Create notification for seller
    await ctx.db.insert("notifications", {
      userId: derivedSellerId,
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

    // Run fraud detection check
    await ctx.scheduler.runAfter(0, internal.fraud.checkOrder, {
      orderId,
      buyerId: buyer._id,
      totalAmount, // Item subtotal (not finalTotal) for accurate high-value detection
      shippingAddress: args.shippingAddress,
    });

    // Send order confirmation email
    await ctx.scheduler.runAfter(0, internal.email.sendOrderConfirmation, {
      to: buyer.email,
      buyerName: buyer.name,
      orderId,
      orderTotal: totalAmount,
      items: args.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
      })),
      paymentMethod: args.paymentMethod,
    });

    return orderId;
  },
});

export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const buyer = await requireMutationAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Only the buyer who placed the order can cancel it
    if (order.buyerId !== buyer._id) {
      throw new Error("Access denied");
    }

    // Only cancellable if pending or confirmed
    if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
      throw new Error("This order can no longer be cancelled");
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: product.stock + item.quantity,
          soldCount: Math.max(0, product.soldCount - item.quantity),
        });
      }
    }

    // Refund balance if paid via Somago Balance
    if (order.paymentMethod === "balance" && order.paymentStatus === "paid") {
      const refundAmount = order.finalTotal ?? order.totalAmount;
      await ctx.db.patch(buyer._id, {
        balance: (buyer.balance ?? 0) + refundAmount,
      });
      await ctx.db.patch(args.orderId, {
        orderStatus: "cancelled",
        paymentStatus: "refunded",
      });
    } else {
      await ctx.db.patch(args.orderId, { orderStatus: "cancelled" });
    }

    // Notify the seller
    await ctx.db.insert("notifications", {
      userId: order.sellerId,
      type: "order_update",
      title: "Order Cancelled",
      body: `A buyer has cancelled order #${args.orderId.slice(-8).toUpperCase()}`,
      data: { orderId: args.orderId },
      isRead: false,
      createdAt: Date.now(),
    });
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
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (user.role !== "seller" && user.role !== "admin") return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
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
    const user = await requireMutationAuth(ctx);
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

    // On delivery: trigger loyalty points, referral reward check
    if (args.status === "delivered") {
      const orderTotal = order.finalTotal ?? order.totalAmount;
      await ctx.scheduler.runAfter(0, internal.loyalty.earnPoints, {
        userId: order.buyerId,
        orderId: args.orderId,
        orderTotal,
      });
      await ctx.scheduler.runAfter(0, internal.referrals.checkAndReward, {
        buyerId: order.buyerId,
      });
    }

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

    // Send email to buyer
    const buyer = await ctx.db.get(order.buyerId);
    if (buyer) {
      await ctx.scheduler.runAfter(0, internal.email.sendOrderStatusUpdate, {
        to: buyer.email,
        buyerName: buyer.name,
        orderId: args.orderId,
        status: args.status,
        trackingNumber: args.trackingNumber,
      });
    }
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
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

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
