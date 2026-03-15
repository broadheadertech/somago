// @ts-nocheck
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

// ── Queries ───────────────────────────────────────────────────

export const getMyReferralCode = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a code (first 4 chars of name + random 4 digits)
    // Note: in a query we can't write, so we return a generated code
    // The actual persistence happens on first share/copy via ensureReferralCode mutation
    const namePrefix = (user.name || "USER")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    return namePrefix + randomDigits;
  },
});

export const ensureReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMutationAuth(ctx);

    if (user.referralCode) {
      return user.referralCode;
    }

    const namePrefix = (user.name || "USER")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const code = namePrefix + randomDigits;

    await ctx.db.patch(user._id, { referralCode: code });
    return code;
  },
});

export const getMyReferrals = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", user._id))
      .collect();

    // Enrich with referred user names
    const enriched = await Promise.all(
      referrals.map(async (r) => {
        const referred = await ctx.db.get(r.referredId);
        return {
          _id: r._id,
          referredName: referred?.name ?? "Unknown",
          status: r.status,
          rewardGiven: r.rewardGiven,
          createdAt: r.createdAt,
        };
      })
    );

    return enriched;
  },
});

export const getMyReferralStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { count: 0, earned: 0 };

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", user._id))
      .collect();

    const completedCount = referrals.filter((r) => r.rewardGiven).length;

    return {
      count: referrals.length,
      earned: completedCount * 50, // ₱50 per completed referral
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────

export const applyReferralCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    // Can't refer yourself
    if (user.referralCode === args.code) {
      throw new Error("You cannot use your own referral code");
    }

    // Check if user was already referred
    const existingReferral = await ctx.db
      .query("referrals")
      .withIndex("by_referredId", (q) => q.eq("referredId", user._id))
      .first();

    if (existingReferral) {
      throw new Error("You have already used a referral code");
    }

    // Find the referrer by code (using index)
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.code))
      .first();

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    // Create referral record (pending until first order completes)
    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referredId: user._id,
      referralCode: args.code,
      status: "pending",
      rewardGiven: false,
      createdAt: Date.now(),
    });

    return { success: true, referrerName: referrer.name };
  },
});

export const checkAndReward = internalMutation({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if buyer was referred and reward hasn't been given yet
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referredId", (q) => q.eq("referredId", args.buyerId))
      .filter((q) => q.eq(q.field("rewardGiven"), false))
      .first();

    if (!referral) return;

    // Check this is the buyer's first delivered order
    const deliveredOrders = await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) => q.eq(q.field("orderStatus"), "delivered"))
      .take(2);

    // Only reward on the very first delivery
    if (deliveredOrders.length !== 1) return;

    // Give ₱50 to both users
    const referrer = await ctx.db.get(referral.referrerId);
    const referred = await ctx.db.get(referral.referredId);

    if (referrer) {
      await ctx.db.patch(referrer._id, {
        balance: (referrer.balance ?? 0) + 50,
      });
      await ctx.db.insert("notifications", {
        userId: referrer._id,
        type: "promotion",
        title: "Referral Reward!",
        body: `Your friend completed their first order! You earned ₱50.`,
        data: {},
        isRead: false,
        createdAt: Date.now(),
      });
    }

    if (referred) {
      await ctx.db.patch(referred._id, {
        balance: (referred.balance ?? 0) + 50,
      });
      await ctx.db.insert("notifications", {
        userId: referred._id,
        type: "promotion",
        title: "Referral Reward!",
        body: `You earned ₱50 for completing your first order with a referral!`,
        data: {},
        isRead: false,
        createdAt: Date.now(),
      });
    }

    // Mark referral as completed and rewarded
    await ctx.db.patch(referral._id, {
      status: "completed",
      rewardGiven: true,
    });
  },
});
