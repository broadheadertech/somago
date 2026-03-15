import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireMutationAuth, requireAdmin, getCurrentUser } from "./auth";

// ── Webhook: Sync user from Clerk ──────────────────────────────
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatar: args.avatar ?? existing.avatar,
        phone: args.phone ?? existing.phone,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "buyer",
      avatar: args.avatar,
      phone: args.phone,
      createdAt: Date.now(),
    });
  },
});

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// ── Queries ────────────────────────────────────────────────────
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getSellerProfile = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller || seller.role !== "seller") return null;
    return {
      _id: seller._id,
      name: seller.name,
      avatar: seller.avatar,
      shopProfile: seller.shopProfile,
      sellerStatus: seller.sellerStatus,
      createdAt: seller.createdAt,
    };
  },
});

export const getSellerBadge = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const seller = await ctx.db.get(args.sellerId);
    if (!seller || seller.role !== "seller") return { badge: "new" as const };

    // Lightweight: count only delivered orders (limited scan)
    const deliveredOrders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .filter((q) => q.eq(q.field("orderStatus"), "delivered"))
      .take(101); // Only need to know if >= 100

    const totalSales = deliveredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    // Lightweight: only fetch products for rating (limited)
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .take(50); // Cap at 50 products for badge calc

    let totalRating = 0;
    let reviewCount = 0;
    for (const product of products) {
      if (product.reviewCount > 0) {
        totalRating += product.rating * product.reviewCount;
        reviewCount += product.reviewCount;
      }
    }
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    if (totalSales >= 100 && avgRating >= 4.5) {
      return { badge: "top_seller" as const, totalSales, avgRating };
    }
    if (totalSales >= 10 && avgRating >= 4.0) {
      return { badge: "verified" as const, totalSales, avgRating };
    }
    return { badge: "new" as const, totalSales, avgRating };
  },
});

// ── Mutations ──────────────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const updates: Record<string, string | undefined> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.phone !== undefined) updates.phone = args.phone;
    await ctx.db.patch(user._id, updates);
  },
});

export const addAddress = mutation({
  args: {
    label: v.string(),
    fullName: v.string(),
    phone: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    province: v.string(),
    postalCode: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const addresses = user.addresses ?? [];

    if (args.isDefault) {
      // Unset other defaults
      for (let i = 0; i < addresses.length; i++) {
        addresses[i] = { ...addresses[i], isDefault: false };
      }
    }

    // First address is always default
    if (addresses.length === 0) {
      args.isDefault = true;
    }

    addresses.push(args);
    await ctx.db.patch(user._id, { addresses });
  },
});

export const updateAddress = mutation({
  args: {
    index: v.number(),
    label: v.string(),
    fullName: v.string(),
    phone: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    province: v.string(),
    postalCode: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const addresses = [...(user.addresses ?? [])];
    const { index, ...address } = args;

    if (index < 0 || index >= addresses.length) {
      throw new Error("Invalid address index");
    }

    if (address.isDefault) {
      for (let i = 0; i < addresses.length; i++) {
        addresses[i] = { ...addresses[i], isDefault: false };
      }
    }

    addresses[index] = address;
    await ctx.db.patch(user._id, { addresses });
  },
});

export const deleteAddress = mutation({
  args: { index: v.number() },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const addresses = [...(user.addresses ?? [])];

    if (args.index < 0 || args.index >= addresses.length) {
      throw new Error("Invalid address index");
    }

    const wasDefault = addresses[args.index].isDefault;
    addresses.splice(args.index, 1);

    // If we removed the default, make the first remaining one default
    if (wasDefault && addresses.length > 0) {
      addresses[0] = { ...addresses[0], isDefault: true };
    }

    await ctx.db.patch(user._id, { addresses });
  },
});

// ── Seller Registration ────────────────────────────────────────
export const applyAsSeller = mutation({
  args: {
    shopName: v.string(),
    businessType: v.optional(v.string()),
    idDocumentStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (user.role === "seller") {
      throw new Error("Already a seller");
    }

    await ctx.db.patch(user._id, {
      sellerStatus: "pending",
      sellerIdDocument: args.idDocumentStorageId,
      businessDetails: {
        businessName: args.shopName,
        businessType: args.businessType,
      },
      shopProfile: {
        shopName: args.shopName,
      },
    });
  },
});

export const updateShopProfile = mutation({
  args: {
    shopName: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
    banner: v.optional(v.id("_storage")),
    bannerUrl: v.optional(v.string()),
    shippingPolicy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    if (user.role !== "seller" || user.sellerStatus !== "approved") {
      throw new Error("Approved seller access required");
    }

    const current = user.shopProfile ?? { shopName: user.name };

    // Resolve logo storage ID to URL if uploaded
    let logoUrl = args.logoUrl ?? current.logoUrl;
    if (args.logo) {
      const url = await ctx.storage.getUrl(args.logo);
      if (url) logoUrl = url;
    }

    // Resolve banner storage ID to URL if uploaded
    let resolvedBannerUrl = args.bannerUrl ?? current.bannerUrl;
    if (args.banner) {
      const url = await ctx.storage.getUrl(args.banner);
      if (url) resolvedBannerUrl = url;
    }

    await ctx.db.patch(user._id, {
      shopProfile: {
        shopName: args.shopName ?? current.shopName,
        description: args.description ?? current.description,
        logo: args.logo ?? current.logo,
        logoUrl,
        bannerUrl: resolvedBannerUrl,
        shippingPolicy: args.shippingPolicy ?? current.shippingPolicy,
      },
    });
  },
});

// ── Admin: Seller Management ───────────────────────────────────
export const listSellerApplications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    return await ctx.db
      .query("users")
      .withIndex("by_sellerStatus", (q) => q.eq("sellerStatus", "pending"))
      .collect();
  },
});

export const reviewSellerApplication = mutation({
  args: {
    userId: v.id("users"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user || user.sellerStatus !== "pending") {
      throw new Error("No pending application found");
    }

    if (args.decision === "approved") {
      await ctx.db.patch(args.userId, {
        role: "seller",
        sellerStatus: "approved",
      });
    } else {
      await ctx.db.patch(args.userId, {
        sellerStatus: "rejected",
      });
    }

    // Audit log
    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: `seller_application_${args.decision}`,
      targetType: "user",
      targetId: args.userId,
      details: args.reason,
      createdAt: Date.now(),
    });

    // Send email
    await ctx.scheduler.runAfter(0, internal.email.sendSellerApplicationDecision, {
      to: user.email,
      sellerName: user.name,
      decision: args.decision,
      reason: args.reason,
    });
  },
});

export const listAllUsers = query({
  args: {
    role: v.optional(
      v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    }
    return await ctx.db.query("users").collect();
  },
});

// ── Batch Approve Seller Applications ──────────────────────────
export const batchReviewSellerApplications = mutation({
  args: {
    userIds: v.array(v.id("users")),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    if (args.userIds.length > 50) {
      throw new Error("Maximum 50 applications per batch");
    }
    const admin = await requireAdmin(ctx);
    let processed = 0;

    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.sellerStatus !== "pending") continue;

      if (args.decision === "approved") {
        await ctx.db.patch(userId, { role: "seller", sellerStatus: "approved" });
      } else {
        await ctx.db.patch(userId, { sellerStatus: "rejected" });
      }

      await ctx.db.insert("auditLog", {
        adminId: admin._id,
        action: `seller_application_${args.decision}`,
        targetType: "user",
        targetId: userId,
        createdAt: Date.now(),
      });
      processed++;
    }
    return { processed };
  },
});

// ── Seller Strike System ──────────────────────────────────────
export const addStrike = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentStrikes = (user.strikeCount ?? 0) + 1;
    const updates: Record<string, any> = { strikeCount: currentStrikes };

    // 3 strikes = suspended
    if (currentStrikes >= 3) {
      updates.sellerStatus = "suspended";
    }

    await ctx.db.patch(args.userId, updates);

    // Notify seller
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "system",
      title: currentStrikes >= 3 ? "Account Suspended" : "Warning: Strike Issued",
      body: currentStrikes >= 3
        ? `Your account has been suspended after ${currentStrikes} strikes. Reason: ${args.reason}`
        : `You received a strike (${currentStrikes}/3). Reason: ${args.reason}`,
      data: {},
      isRead: false,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: currentStrikes >= 3 ? "seller_suspended" : "seller_strike",
      targetType: "user",
      targetId: args.userId,
      details: `Strike ${currentStrikes}/3: ${args.reason}`,
      createdAt: Date.now(),
    });

    return { strikes: currentStrikes, suspended: currentStrikes >= 3 };
  },
});

// ── Seller: Low Stock Threshold ──────────────────────────────
export const setLowStockThreshold = mutation({
  args: { threshold: v.number() },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Seller access required");
    }
    if (args.threshold < 0) {
      throw new Error("Threshold cannot be negative");
    }
    await ctx.db.patch(user._id, { lowStockThreshold: args.threshold });
  },
});

// ── Dev Only: Role Switcher (disabled in production) ─────────
export const devSwitchRole = mutation({
  args: {
    role: v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // Block in production — only allow in dev Convex deployments
    const isDev = process.env.CONVEX_CLOUD_URL?.includes("dev") ||
      process.env.IS_DEV === "true";
    if (!isDev) {
      throw new Error("Dev role switching is disabled in production");
    }

    const user = await requireMutationAuth(ctx);
    const updates: Record<string, any> = { role: args.role };

    if (args.role === "seller") {
      updates.sellerStatus = "approved";
      if (!user.shopProfile) {
        updates.shopProfile = { shopName: user.name + "'s Shop" };
      }
    }

    await ctx.db.patch(user._id, updates);
  },
});

// ── Chat Auto-Reply Settings ──────────────────────────────────
export const updateChatAutoReply = mutation({
  args: {
    enabled: v.boolean(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can set auto-reply");
    }
    if (args.message.length > 500) {
      throw new Error("Auto-reply message too long (max 500 characters)");
    }
    await ctx.db.patch(user._id, {
      chatAutoReply: {
        enabled: args.enabled,
        message: args.message,
      },
    });
  },
});
