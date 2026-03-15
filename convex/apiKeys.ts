// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

// TODO: Replace with crypto.randomUUID() or crypto.getRandomValues() for production
// Math.random() is NOT cryptographically secure — acceptable for demo only
function generateRandomKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk_somago_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export const generateKey = mutation({
  args: {
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller" || user.sellerStatus !== "approved")
      throw new Error("Seller access required");

    if (!args.name.trim()) throw new Error("Key name is required");
    if (args.permissions.length === 0) throw new Error("At least one permission required");

    // Limit keys per seller
    const existingKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .take(20);
    const activeKeys = existingKeys.filter((k) => k.isActive);
    if (activeKeys.length >= 10) throw new Error("Maximum 10 active API keys");

    const key = generateRandomKey();
    const keyPrefix = key.slice(0, 16);

    await ctx.db.insert("apiKeys", {
      sellerId: user._id,
      name: args.name.slice(0, 100),
      keyHash: key, // In production, store a proper hash
      keyPrefix,
      permissions: args.permissions.slice(0, 10),
      isActive: true,
      createdAt: Date.now(),
    });

    return { key };
  },
});

export const listMyKeys = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(20);

    // Strip keyHash — never expose full key after creation
    return keys.map(({ keyHash, ...rest }) => rest);
  },
});

export const revokeKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");
    if (key.sellerId !== user._id && user.role !== "admin")
      throw new Error("Not authorized");

    await ctx.db.patch(args.keyId, { isActive: false });
  },
});

export const adminListKeys = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const keys = await ctx.db
      .query("apiKeys")
      .take(100);

    const enriched = await Promise.all(
      keys.map(async (k) => {
        const seller = await ctx.db.get(k.sellerId);
        const { keyHash, ...safeKey } = k;
        return {
          ...safeKey,
          sellerName: seller?.shopProfile?.shopName || seller?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});
