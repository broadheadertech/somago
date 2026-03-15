import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAuth, requireAdmin, getCurrentUser } from "./auth";

// ── Webhook: Sync user from Clerk ──────────────────────────────
export const syncUser = internalMutation({
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

export const deleteUser = internalMutation({
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

// ── Mutations ──────────────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
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
    const user = await requireAuth(ctx);
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
    const user = await requireAuth(ctx);
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
    const user = await requireAuth(ctx);
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
    const user = await requireAuth(ctx);

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
    shippingPolicy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.role !== "seller" || user.sellerStatus !== "approved") {
      throw new Error("Approved seller access required");
    }

    const current = user.shopProfile ?? { shopName: user.name };
    await ctx.db.patch(user._id, {
      shopProfile: {
        shopName: args.shopName ?? current.shopName,
        description: args.description ?? current.description,
        logo: args.logo ?? current.logo,
        shippingPolicy: args.shippingPolicy ?? current.shippingPolicy,
      },
    });
  },
});

// ── Admin: Seller Management ───────────────────────────────────
export const listSellerApplications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
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
  },
});

export const listAllUsers = query({
  args: {
    role: v.optional(
      v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin"))
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    }
    return await ctx.db.query("users").collect();
  },
});
