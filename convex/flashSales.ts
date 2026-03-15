import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin, getCurrentUser } from "./auth";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sales = await ctx.db
      .query("flashSales")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const activeSales = sales.filter(
      (sale) => now >= sale.startAt && now <= sale.endAt
    );

    const results = await Promise.all(
      activeSales.map(async (sale) => {
        const product = await ctx.db.get(sale.productId);
        return {
          ...sale,
          product,
        };
      })
    );

    return results.filter((r) => r.product !== null && r.product.status === "active");
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const sales = await ctx.db.query("flashSales").order("desc").collect();

    const results = await Promise.all(
      sales.map(async (sale) => {
        const product = await ctx.db.get(sale.productId);
        return {
          ...sale,
          product,
        };
      })
    );

    return results;
  },
});

export const toggleActive = mutation({
  args: { flashSaleId: v.id("flashSales") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sale = await ctx.db.get(args.flashSaleId);
    if (!sale) throw new Error("Flash sale not found");

    await ctx.db.patch(args.flashSaleId, { isActive: !sale.isActive });
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    salePrice: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    stockLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.endAt <= args.startAt) {
      throw new Error("End time must be after start time");
    }
    if (args.salePrice <= 0) {
      throw new Error("Sale price must be positive");
    }
    if (args.stockLimit !== undefined && args.stockLimit <= 0) {
      throw new Error("Stock limit must be positive");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    if (args.salePrice >= product.price) {
      throw new Error("Sale price must be less than the original price");
    }

    return await ctx.db.insert("flashSales", {
      productId: args.productId,
      salePrice: args.salePrice,
      originalPrice: product.price,
      startAt: args.startAt,
      endAt: args.endAt,
      stockLimit: args.stockLimit,
      soldCount: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const checkFlashPrice = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sales = await ctx.db
      .query("flashSales")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(10);

    const activeSale = sales.find(
      (sale) =>
        sale.isActive &&
        now >= sale.startAt &&
        now <= sale.endAt &&
        (sale.stockLimit === undefined || sale.soldCount < sale.stockLimit)
    );

    if (!activeSale) return null;

    return {
      salePrice: activeSale.salePrice,
      originalPrice: activeSale.originalPrice,
      endAt: activeSale.endAt,
      stockLimit: activeSale.stockLimit,
      soldCount: activeSale.soldCount,
    };
  },
});
