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

export const searchSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q.search("name", args.query).eq("status", "active")
      )
      .take(5);
    return results.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
    }));
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const limitedIds = args.ids.slice(0, 20);
    const products = await Promise.all(
      limitedIds.map((id) => ctx.db.get(id))
    );
    return products.filter(
      (p): p is NonNullable<typeof p> => p !== null && p.status === "active"
    );
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

export const getBySellerId = query({
  args: {
    sellerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit);
  },
});

// ── AI Recommendations ────────────────────────────────────────
export const getRecommendations = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    // Find products in the same category (excluding current) — capped at 50
    const sameCategoryProducts = await ctx.db
      .query("products")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", product.categoryId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.neq(q.field("_id"), args.productId)
        )
      )
      .take(50);

    // Sort: same price range first (within 50% of current price), then by popularity
    const minPrice = product.price * 0.5;
    const maxPrice = product.price * 1.5;

    const scored = sameCategoryProducts.map((p) => {
      const inPriceRange = p.price >= minPrice && p.price <= maxPrice;
      const popularityScore = p.rating * p.reviewCount;
      return { product: p, inPriceRange, popularityScore };
    });

    scored.sort((a, b) => {
      if (a.inPriceRange && !b.inPriceRange) return -1;
      if (!a.inPriceRange && b.inPriceRange) return 1;
      return b.popularityScore - a.popularityScore;
    });

    const results = scored.slice(0, limit).map((s) => ({
      _id: s.product._id,
      name: s.product.name,
      price: s.product.price,
      originalPrice: s.product.originalPrice,
      imageUrl: s.product.imageUrl,
      rating: s.product.rating,
      reviewCount: s.product.reviewCount,
      soldCount: s.product.soldCount,
    }));

    // If not enough same-category products, fill with top-rated from any category
    if (results.length < limit) {
      const remaining = limit - results.length;
      const existingIds = new Set([args.productId, ...results.map((r) => r._id)]);

      const topRated = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(30);

      const fillers = topRated
        .filter((p) => !existingIds.has(p._id))
        .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
        .slice(0, remaining)
        .map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          imageUrl: p.imageUrl,
          rating: p.rating,
          reviewCount: p.reviewCount,
          soldCount: p.soldCount,
        }));

      results.push(...fillers);
    }

    return results;
  },
});

export const getPersonalized = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    const user = await getCurrentUser(ctx);

    // Helper: get top-selling products platform-wide
    const getTopSelling = async (excludeIds: Set<string> = new Set()) => {
      const allActive = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(50);

      return allActive
        .filter((p) => !excludeIds.has(p._id as string))
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, limit)
        .map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          imageUrl: p.imageUrl,
          rating: p.rating,
          reviewCount: p.reviewCount,
          soldCount: p.soldCount,
        }));
    };

    if (!user) {
      return await getTopSelling();
    }

    // Get user's recent orders (last 5)
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .take(5);

    if (recentOrders.length === 0) {
      return await getTopSelling();
    }

    // Extract categories and ordered product IDs from recent orders
    const orderedProductIds = new Set<string>();
    const categoryIds = new Set<string>();

    for (const order of recentOrders) {
      for (const item of order.items) {
        orderedProductIds.add(item.productId as string);
        const product = await ctx.db.get(item.productId);
        if (product) {
          categoryIds.add(product.categoryId as string);
        }
      }
    }

    // Find popular products in those categories the user hasn't ordered
    const recommendations: Array<{
      _id: any;
      name: string;
      price: number;
      originalPrice?: number;
      imageUrl?: string;
      rating: number;
      reviewCount: number;
      soldCount: number;
    }> = [];

    for (const categoryId of categoryIds) {
      if (recommendations.length >= limit) break;

      const categoryProducts = await ctx.db
        .query("products")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", categoryId as any))
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(20);

      const unordered = categoryProducts
        .filter((p) => !orderedProductIds.has(p._id as string))
        .sort((a, b) => b.soldCount - a.soldCount);

      for (const p of unordered) {
        if (recommendations.length >= limit) break;
        if (!recommendations.some((r) => r._id === p._id)) {
          recommendations.push({
            _id: p._id,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            imageUrl: p.imageUrl,
            rating: p.rating,
            reviewCount: p.reviewCount,
            soldCount: p.soldCount,
          });
        }
      }
    }

    // Fill remaining slots with top-selling products
    if (recommendations.length < limit) {
      const existingIds = new Set([
        ...orderedProductIds,
        ...recommendations.map((r) => r._id as string),
      ]);
      const fillers = await getTopSelling(existingIds);
      for (const f of fillers) {
        if (recommendations.length >= limit) break;
        recommendations.push(f);
      }
    }

    return recommendations;
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
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);

    // Resolve storage IDs to real URLs, filter out blob: URLs from client
    const isValidUrl = (u: string) => u.startsWith("http://") || u.startsWith("https://");

    let resolvedImageUrl = args.imageUrl && isValidUrl(args.imageUrl) ? args.imageUrl : undefined;
    const resolvedImageUrls = (args.imageUrls ?? []).filter(isValidUrl);

    // Always resolve storage IDs to real Convex URLs
    if (args.images.length > 0) {
      for (const storageId of args.images) {
        const url = await ctx.storage.getUrl(storageId);
        if (url) {
          if (!resolvedImageUrl) resolvedImageUrl = url;
          resolvedImageUrls.push(url);
        }
      }
    }

    return await ctx.db.insert("products", {
      sellerId: seller._id,
      name: args.name,
      description: args.description,
      categoryId: args.categoryId,
      price: args.price,
      originalPrice: args.originalPrice,
      variants: args.variants,
      images: args.images,
      imageUrl: resolvedImageUrl,
      imageUrls: resolvedImageUrls.length > 0 ? resolvedImageUrls : undefined,
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

export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== seller._id) {
      throw new Error("You can only update your own products");
    }
    if (args.stock < 0) throw new Error("Stock cannot be negative");
    await ctx.db.patch(args.productId, { stock: args.stock });
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

export const bulkCreate = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        categoryId: v.id("categories"),
        price: v.number(),
        stock: v.number(),
        imageUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);

    if (args.products.length === 0) {
      throw new Error("No products to import");
    }
    if (args.products.length > 50) {
      throw new Error("Maximum 50 products per batch");
    }

    const results: { index: number; success: boolean; error?: string; id?: string }[] = [];

    for (let i = 0; i < args.products.length; i++) {
      const p = args.products[i];
      try {
        if (!p.name || p.name.trim().length === 0) {
          throw new Error("Name is required");
        }
        if (!p.description || p.description.trim().length === 0) {
          throw new Error("Description is required");
        }
        if (p.price <= 0) {
          throw new Error("Price must be positive");
        }
        if (p.stock < 0) {
          throw new Error("Stock cannot be negative");
        }

        // Validate category exists
        const category = await ctx.db.get(p.categoryId);
        if (!category) {
          throw new Error("Invalid category");
        }

        const id = await ctx.db.insert("products", {
          sellerId: seller._id,
          name: p.name.trim(),
          description: p.description.trim(),
          categoryId: p.categoryId,
          price: p.price,
          imageUrl: p.imageUrl,
          images: [],
          stock: p.stock,
          soldCount: 0,
          rating: 0,
          reviewCount: 0,
          status: "active",
          createdAt: Date.now(),
        });

        results.push({ index: i, success: true, id: id as string });
      } catch (e: any) {
        results.push({ index: i, success: false, error: e.message || "Unknown error" });
      }
    }

    return results;
  },
});

// ── Seller: My Products ────────────────────────────────────────
export const listMyProducts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    if (user.role !== "seller" && user.role !== "admin") return [];

    return await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .filter((q) => q.neq(q.field("status"), "removed"))
      .collect();
  },
});

// ── Admin: Moderation ──────────────────────────────────────────
export const listFlagged = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

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
