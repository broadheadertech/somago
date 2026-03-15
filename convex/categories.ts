import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const getTopLevel = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parentId", (q) => q.eq("parentId", undefined))
      .collect();
  },
});

export const getSubcategories = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Check if already seeded
    const existing = await ctx.db.query("categories").first();
    if (existing) {
      throw new Error("Categories already seeded");
    }

    const topCategories = [
      { name: "Electronics", icon: "📱", order: 1 },
      { name: "Fashion", icon: "👗", order: 2 },
      { name: "Home & Living", icon: "🏠", order: 3 },
      { name: "Health & Beauty", icon: "💄", order: 4 },
      { name: "Sports & Outdoors", icon: "⚽", order: 5 },
      { name: "Food & Beverages", icon: "🍔", order: 6 },
      { name: "Toys & Games", icon: "🎮", order: 7 },
      { name: "Automotive", icon: "🚗", order: 8 },
      { name: "Books & Stationery", icon: "📚", order: 9 },
      { name: "Pets", icon: "🐾", order: 10 },
    ];

    const subcategories: Record<string, string[]> = {
      Electronics: ["Phones & Tablets", "Laptops & Computers", "Audio", "Cameras", "Accessories"],
      Fashion: ["Women's Clothing", "Men's Clothing", "Shoes", "Bags", "Accessories"],
      "Home & Living": ["Furniture", "Kitchen", "Decor", "Bedding", "Tools"],
      "Health & Beauty": ["Skincare", "Makeup", "Hair Care", "Supplements", "Personal Care"],
      "Sports & Outdoors": ["Exercise Equipment", "Sportswear", "Outdoor Gear", "Team Sports"],
      "Food & Beverages": ["Snacks", "Beverages", "Cooking Essentials", "Fresh Food"],
      "Toys & Games": ["Action Figures", "Board Games", "Puzzles", "Educational Toys"],
      Automotive: ["Car Accessories", "Motorcycle Parts", "Tools", "Car Care"],
      "Books & Stationery": ["Fiction", "Non-Fiction", "School Supplies", "Art Supplies"],
      Pets: ["Pet Food", "Pet Accessories", "Pet Care", "Pet Toys"],
    };

    for (const cat of topCategories) {
      const parentId = await ctx.db.insert("categories", {
        name: cat.name,
        icon: cat.icon,
        order: cat.order,
      });

      const subs = subcategories[cat.name] ?? [];
      for (let i = 0; i < subs.length; i++) {
        await ctx.db.insert("categories", {
          name: subs[i],
          parentId,
          order: i + 1,
        });
      }
    }
  },
});
