import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

export const isFollowing = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", user._id).eq("sellerId", args.sellerId)
      )
      .first();

    return !!follow;
  },
});

export const toggle = mutation({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (user._id === args.sellerId) {
      throw new Error("You cannot follow yourself");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", user._id).eq("sellerId", args.sellerId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }

    await ctx.db.insert("follows", {
      followerId: user._id,
      sellerId: args.sellerId,
      createdAt: Date.now(),
    });
    return { following: true };
  },
});

export const getFollowerCount = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    // Cap at 10000 to prevent unbounded scans
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .take(10000);
    return followers.length;
  },
});

export const getFollowedSellers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_followerId", (q) => q.eq("followerId", user._id))
      .collect();

    const sellers = await Promise.all(
      follows.map(async (f) => {
        const seller = await ctx.db.get(f.sellerId);
        if (!seller) return null;
        return {
          _id: seller._id,
          name: seller.name,
          avatar: seller.avatar,
          shopProfile: seller.shopProfile,
          followedAt: f.createdAt,
        };
      })
    );

    return sellers.filter(Boolean);
  },
});
