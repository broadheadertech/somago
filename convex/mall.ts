// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

export const applyForMall = mutation({
  args: {
    brandName: v.string(),
    brandDescription: v.string(),
    businessRegistration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "seller" || user.sellerStatus !== "approved")
      throw new Error("Seller access required");
    if (user.mallStatus === "approved")
      throw new Error("Already a Mall seller");
    if (user.mallStatus === "pending")
      throw new Error("Application already pending");

    await ctx.db.insert("mallApplications", {
      sellerId: user._id,
      brandName: args.brandName.slice(0, 200),
      brandDescription: args.brandDescription.slice(0, 2000),
      businessRegistration: args.businessRegistration?.slice(0, 500),
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.patch(user._id, { mallStatus: "pending" });
  },
});

export const listApplications = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    let apps;
    if (args.status) {
      apps = await ctx.db
        .query("mallApplications")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(100);
    } else {
      apps = await ctx.db
        .query("mallApplications")
        .order("desc")
        .take(100);
    }

    const enriched = await Promise.all(
      apps.map(async (app) => {
        const seller = await ctx.db.get(app.sellerId);
        return {
          ...app,
          sellerName: seller?.shopProfile?.shopName || seller?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const reviewApplication = mutation({
  args: {
    applicationId: v.id("mallApplications"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") throw new Error("Admin access required");

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") throw new Error("Application already reviewed");

    await ctx.db.patch(args.applicationId, {
      status: args.status,
      adminNotes: args.adminNotes?.slice(0, 500),
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    await ctx.db.patch(app.sellerId, {
      mallStatus: args.status,
    });
  },
});

export const getMallSellers = query({
  args: {},
  handler: async (ctx) => {
    const sellers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "seller"))
      .take(200);

    const mallSellers = sellers.filter((s) => s.mallStatus === "approved").slice(0, 50);

    const enriched = await Promise.all(
      mallSellers.map(async (seller) => {
        // Use capped counts instead of full collects
        const products = await ctx.db
          .query("products")
          .withIndex("by_sellerId", (q) => q.eq("sellerId", seller._id))
          .take(100);
        const productCount = products.filter((p) => p.status === "active").length;

        const followers = await ctx.db
          .query("follows")
          .withIndex("by_sellerId", (q) => q.eq("sellerId", seller._id))
          .take(100);

        // Return only public shop info — no PII
        return {
          _id: seller._id,
          name: seller.name,
          shopProfile: seller.shopProfile,
          mallStatus: seller.mallStatus,
          subscriptionPlan: seller.subscriptionPlan,
          productCount,
          followerCount: followers.length,
        };
      })
    );

    return enriched;
  },
});

export const getMyMallStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const application = await ctx.db
      .query("mallApplications")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .first();

    return {
      mallStatus: user.mallStatus || "none",
      application,
    };
  },
});
