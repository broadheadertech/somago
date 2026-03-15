import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth, requireSeller, requireAdmin } from "./auth";

// ── Validate Voucher Code ─────────────────────────────────────
export const validate = query({
  args: {
    code: v.string(),
    orderAmount: v.number(),
    sellerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { valid: false, error: "Please sign in" };

    const code = args.code.toUpperCase().trim();
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!voucher) return { valid: false, error: "Invalid voucher code" };
    if (!voucher.isActive) return { valid: false, error: "This voucher is no longer active" };
    if (voucher.expiresAt && voucher.expiresAt < Date.now()) {
      return { valid: false, error: "This voucher has expired" };
    }
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, error: "This voucher has been fully redeemed" };
    }
    if (voucher.minOrderAmount && args.orderAmount < voucher.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order of ₱${voucher.minOrderAmount.toLocaleString()} required`,
      };
    }
    // Seller-specific voucher check
    if (voucher.sellerId && args.sellerId && voucher.sellerId !== args.sellerId) {
      return { valid: false, error: "This voucher is not valid for this seller" };
    }

    // Check if user already used this voucher
    const used = await ctx.db
      .query("voucherUsage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("voucherId"), voucher._id))
      .first();
    if (used) return { valid: false, error: "You've already used this voucher" };

    // Calculate discount
    let discount = 0;
    if (voucher.type === "fixed") {
      discount = voucher.value;
    } else {
      discount = Math.round(args.orderAmount * (voucher.value / 100));
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
    }
    discount = Math.min(discount, args.orderAmount); // Can't discount more than order

    return {
      valid: true,
      voucherId: voucher._id,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      discount,
      description:
        voucher.type === "fixed"
          ? `₱${voucher.value} off`
          : `${voucher.value}% off${voucher.maxDiscount ? ` (max ₱${voucher.maxDiscount})` : ""}`,
    };
  },
});

// ── Apply Voucher to Order (called during order creation) ─────
export const apply = mutation({
  args: {
    voucherId: v.id("vouchers"),
    orderId: v.id("orders"),
    discount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher || !voucher.isActive) throw new Error("Voucher no longer valid");

    // Check usage limit
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new Error("Voucher has been fully redeemed");
    }

    // Prevent duplicate usage by same user
    const alreadyUsed = await ctx.db
      .query("voucherUsage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("voucherId"), args.voucherId))
      .first();
    if (alreadyUsed) {
      throw new Error("You've already used this voucher");
    }

    // Record usage
    await ctx.db.insert("voucherUsage", {
      voucherId: args.voucherId,
      userId: user._id,
      orderId: args.orderId,
      discount: args.discount,
      createdAt: Date.now(),
    });

    // Increment used count
    await ctx.db.patch(args.voucherId, {
      usedCount: voucher.usedCount + 1,
    });
  },
});

// ── Admin: Create Platform Voucher ────────────────────────────
export const create = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("fixed"), v.literal("percentage")),
    value: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const code = args.code.toUpperCase().trim();

    // Check unique
    const existing = await ctx.db
      .query("vouchers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing) throw new Error("Voucher code already exists");

    if (args.type === "percentage" && (args.value < 1 || args.value > 100)) {
      throw new Error("Percentage must be between 1 and 100");
    }
    if (args.type === "fixed" && args.value <= 0) {
      throw new Error("Fixed discount must be greater than 0");
    }

    return await ctx.db.insert("vouchers", {
      code,
      type: args.type,
      value: args.value,
      minOrderAmount: args.minOrderAmount,
      maxDiscount: args.maxDiscount,
      usageLimit: args.usageLimit,
      usedCount: 0,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

// ── Seller: Create Seller Voucher ─────────────────────────────
export const createSellerVoucher = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal("fixed"), v.literal("percentage")),
    value: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const code = args.code.toUpperCase().trim();

    const existing = await ctx.db
      .query("vouchers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing) throw new Error("Voucher code already exists");

    if (args.type === "percentage" && (args.value < 1 || args.value > 100)) {
      throw new Error("Percentage must be between 1 and 100");
    }
    if (args.type === "fixed" && args.value <= 0) {
      throw new Error("Fixed discount must be greater than 0");
    }

    return await ctx.db.insert("vouchers", {
      code,
      type: args.type,
      value: args.value,
      minOrderAmount: args.minOrderAmount,
      maxDiscount: args.maxDiscount,
      usageLimit: args.usageLimit,
      usedCount: 0,
      sellerId: seller._id,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

// ── List Vouchers ─────────────────────────────────────────────
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];
    return await ctx.db.query("vouchers").order("desc").collect();
  },
});

export const listSellerVouchers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "seller") return [];
    return await ctx.db
      .query("vouchers")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();
  },
});

// ── Toggle Voucher Active Status ──────────────────────────────
export const toggleActive = mutation({
  args: { voucherId: v.id("vouchers") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher) throw new Error("Voucher not found");

    // Only admin or owning seller can toggle
    if (user.role !== "admin" && voucher.sellerId !== user._id) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.voucherId, { isActive: !voucher.isActive });
  },
});
