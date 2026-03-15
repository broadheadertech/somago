import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireSeller, requireAdmin, getCurrentUser } from "./auth";

// ── Public Queries ─────────────────────────────────────────────
export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.categoryId) {
      return await ctx.db
        .query("products")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(limit);
    }

    return await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || product.status === "removed") return null;
    return product;
  },
});

export const search = query({
  args: {
    query: v.string(),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    let searchQuery = ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => {
        let search = q.search("name", args.query);
        if (args.categoryId) {
          search = search.eq("categoryId", args.categoryId);
        }
        return search.eq("status", "active");
      });

    return await searchQuery.take(limit);
  },
});

export const getByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getBySeller = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .collect();
  },
});

// ── Seller Mutations ───────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    variants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          options: v.array(
            v.object({
              label: v.string(),
              price: v.optional(v.number()),
              stock: v.number(),
            })
          ),
        })
      )
    ),
    images: v.array(v.id("_storage")),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);

    return await ctx.db.insert("products", {
      sellerId: seller._id,
      name: args.name,
      description: args.description,
      categoryId: args.categoryId,
      price: args.price,
      originalPrice: args.originalPrice,
      variants: args.variants,
      images: args.images,
      stock: args.stock,
      soldCount: 0,
      rating: 0,
      reviewCount: 0,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    price: v.optional(v.number()),
    originalPrice: v.optional(v.number()),
    variants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          options: v.array(
            v.object({
              label: v.string(),
              price: v.optional(v.number()),
              stock: v.number(),
            })
          ),
        })
      )
    ),
    images: v.optional(v.array(v.id("_storage"))),
    stock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (seller.role !== "admin" && product.sellerId !== seller._id) {
      throw new Error("You can only edit your own products");
    }

    const { productId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(productId, filtered);
  },
});

export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (seller.role !== "admin" && product.sellerId !== seller._id) {
      throw new Error("You can only remove your own products");
    }
    await ctx.db.patch(args.productId, { status: "removed" });
  },
});

// ── Seller: My Products ────────────────────────────────────────
export const listMyProducts = query({
  args: {},
  handler: async (ctx) => {
    const seller = await requireSeller(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", seller._id))
      .filter((q) => q.neq(q.field("status"), "removed"))
      .collect();
  },
});

// ── Admin: Moderation ──────────────────────────────────────────
export const listFlagged = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "flagged"))
      .collect();
  },
});

export const moderate = mutation({
  args: {
    productId: v.id("products"),
    action: v.union(v.literal("approve"), v.literal("warn"), v.literal("remove")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    if (args.action === "approve") {
      await ctx.db.patch(args.productId, { status: "active" });
    } else if (args.action === "remove") {
      await ctx.db.patch(args.productId, { status: "removed" });
      // Increment seller strike count
      const seller = await ctx.db.get(product.sellerId);
      if (seller) {
        await ctx.db.patch(product.sellerId, {
          strikeCount: (seller.strikeCount ?? 0) + 1,
        });
      }
    }
    // "warn" leaves status as "flagged" — seller has 48hrs to fix

    await ctx.db.insert("auditLog", {
      adminId: admin._id,
      action: `product_${args.action}`,
      targetType: "product",
      targetId: args.productId,
      details: args.reason,
      createdAt: Date.now(),
    });
  },
});
