// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Daily Check-In ──────────────────────────────────────────

export const dailyCheckIn = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMutationAuth(ctx);
    const today = getTodayDateString();

    // Check if already checked in today
    const existing = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id).eq("date", today))
      .unique();

    if (existing) {
      throw new Error("Already checked in today");
    }

    // Get yesterday's check-in to calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const yesterdayCheckIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id).eq("date", yesterdayStr))
      .unique();

    const streak = yesterdayCheckIn ? yesterdayCheckIn.streak + 1 : 1;

    // Coins: day 1: 5, day 2: 10, day 3: 15, ..., max 50
    const coinsEarned = Math.min(streak * 5, 50);

    await ctx.db.insert("dailyCheckIns", {
      userId: user._id,
      date: today,
      coinsEarned,
      streak,
      createdAt: Date.now(),
    });

    // Update user coins
    const currentCoins = user.coins ?? 0;
    await ctx.db.patch(user._id, { coins: currentCoins + coinsEarned });

    return { coinsEarned, streak, totalCoins: currentCoins + coinsEarned };
  },
});

export const getCheckInStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const today = getTodayDateString();

    const todayCheckIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id).eq("date", today))
      .unique();

    // Get last 7 days of check-ins
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recentCheckIns = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(7);

    const checkInDates = recentCheckIns.map((c) => c.date);

    // Calculate current streak
    let currentStreak = 0;
    if (todayCheckIn) {
      currentStreak = todayCheckIn.streak;
    } else {
      // Check yesterday for continuing streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const yesterdayCheckIn = await ctx.db
        .query("dailyCheckIns")
        .withIndex("by_userId_date", (q) => q.eq("userId", user._id).eq("date", yesterdayStr))
        .unique();
      currentStreak = yesterdayCheckIn ? yesterdayCheckIn.streak : 0;
    }

    return {
      checkedInToday: !!todayCheckIn,
      currentStreak,
      totalCoins: user.coins ?? 0,
      recentCheckIns: checkInDates,
    };
  },
});

// ── Spin the Wheel ──────────────────────────────────────────

export const spinWheel = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMutationAuth(ctx);
    const currentCoins = user.coins ?? 0;

    if (currentCoins < 10) {
      throw new Error("Not enough coins. You need 10 coins to spin.");
    }

    // Check if already spun today
    const today = getTodayDateString();
    const recentSpins = await ctx.db
      .query("spinHistory")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    if (recentSpins.length > 0) {
      const lastSpinDate = new Date(recentSpins[0].createdAt).toISOString().split("T")[0];
      if (lastSpinDate === today) {
        throw new Error("You can only spin once per day. Come back tomorrow!");
      }
    }

    if (currentCoins < 10) {
      throw new Error("You need at least 10 coins to spin");
    }

    // Deduct coins
    await ctx.db.patch(user._id, { coins: currentCoins - 10 });

    // Random prize: 50% nothing, 20% 5 coins, 15% 10 coins, 10% 20 points, 5% voucher
    const rand = Math.random() * 100;
    let prize: string;
    let prizeType: "coins" | "voucher" | "points" | "nothing";
    let prizeValue: number;

    if (rand < 50) {
      prize = "Better luck next time!";
      prizeType = "nothing";
      prizeValue = 0;
    } else if (rand < 70) {
      prize = "5 Coins";
      prizeType = "coins";
      prizeValue = 5;
      await ctx.db.patch(user._id, { coins: currentCoins - 10 + 5 });
    } else if (rand < 85) {
      prize = "10 Coins";
      prizeType = "coins";
      prizeValue = 10;
      await ctx.db.patch(user._id, { coins: currentCoins - 10 + 10 });
    } else if (rand < 95) {
      prize = "20 Loyalty Points";
      prizeType = "points";
      prizeValue = 20;
      const currentPoints = user.loyaltyPoints ?? 0;
      await ctx.db.patch(user._id, { loyaltyPoints: currentPoints + 20 });
    } else {
      prize = "Voucher Code: LUCKY10";
      prizeType = "voucher";
      prizeValue = 10;
    }

    await ctx.db.insert("spinHistory", {
      userId: user._id,
      prize,
      prizeType,
      prizeValue,
      createdAt: Date.now(),
    });

    return { prize, prizeType, prizeValue };
  },
});

export const getSpinHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("spinHistory")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});
