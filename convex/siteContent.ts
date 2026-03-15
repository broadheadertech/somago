import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin, getCurrentUser } from "./auth";

// ── Get By Type ────────────────────────────────────────────────
export const getByType = query({
  args: {
    type: v.union(v.literal("banner"), v.literal("announcement"), v.literal("section")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("siteContent")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    return items
      .filter((item) => item.isActive)
      .sort((a, b) => a.order - b.order);
  },
});

// ── Get All (admin) ────────────────────────────────────────────
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const items = await ctx.db.query("siteContent").collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

// ── Upsert ─────────────────────────────────────────────────────
export const upsert = mutation({
  args: {
    key: v.string(),
    type: v.union(v.literal("banner"), v.literal("announcement"), v.literal("section")),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        type: args.type,
        title: args.title,
        body: args.body,
        imageUrl: args.imageUrl,
        linkUrl: args.linkUrl,
        isActive: args.isActive,
        order: args.order,
      });
      return existing._id;
    }

    return await ctx.db.insert("siteContent", {
      key: args.key,
      type: args.type,
      title: args.title,
      body: args.body,
      imageUrl: args.imageUrl,
      linkUrl: args.linkUrl,
      isActive: args.isActive,
      order: args.order,
      createdAt: Date.now(),
    });
  },
});

// ── Toggle Active ──────────────────────────────────────────────
export const toggleActive = mutation({
  args: { id: v.id("siteContent") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Content not found");
    await ctx.db.patch(args.id, { isActive: !item.isActive });
  },
});
