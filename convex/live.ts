// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";

// ── Queries ──────────────────────────────────────────────────

export const getActiveRooms = query({
  args: {},
  handler: async (ctx) => {
    const liveRooms = await ctx.db
      .query("liveRooms")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    const scheduledRooms = await ctx.db
      .query("liveRooms")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    const allRooms = [...liveRooms, ...scheduledRooms];

    const roomsWithSellers = await Promise.all(
      allRooms.map(async (room) => {
        const seller = await ctx.db.get(room.sellerId);
        return {
          ...room,
          seller: seller
            ? {
                _id: seller._id,
                name: seller.name,
                avatar: seller.avatar,
                shopProfile: seller.shopProfile,
              }
            : null,
        };
      })
    );

    return roomsWithSellers;
  },
});

export const getRoom = query({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const seller = await ctx.db.get(room.sellerId);

    const products = await Promise.all(
      room.featuredProducts.map(async (productId) => {
        const product = await ctx.db.get(productId);
        if (!product || product.status !== "active") return null;
        return {
          _id: product._id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          imageUrl: product.imageUrl,
          stock: product.stock,
        };
      })
    );

    return {
      ...room,
      seller: seller
        ? {
            _id: seller._id,
            name: seller.name,
            avatar: seller.avatar,
            shopProfile: seller.shopProfile,
          }
        : null,
      products: products.filter(Boolean),
    };
  },
});

export const getRoomMessages = query({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("liveMessages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(50);

    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          ...msg,
          userName: user?.name ?? "Unknown",
          userAvatar: user?.avatar,
        };
      })
    );

    return messagesWithUsers.reverse();
  },
});

// ── Mutations ────────────────────────────────────────────────

export const createRoom = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    featuredProducts: v.array(v.id("products")),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can create live rooms");
    }
    if (user.role === "seller" && user.sellerStatus !== "approved") {
      throw new Error("Your seller account must be approved to go live");
    }
    if (!args.title.trim()) throw new Error("Title is required");
    if (args.title.length > 200) throw new Error("Title too long (max 200 characters)");

    const status = args.scheduledAt ? "scheduled" : "live";

    const roomId = await ctx.db.insert("liveRooms", {
      sellerId: user._id,
      title: args.title,
      description: args.description,
      featuredProducts: args.featuredProducts,
      status,
      viewerCount: 0,
      scheduledAt: args.scheduledAt,
      startedAt: status === "live" ? Date.now() : undefined,
      createdAt: Date.now(),
    });

    return roomId;
  },
});

export const startRoom = mutation({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Only the room owner can start the room");
    }
    if (room.status === "live") throw new Error("Room is already live");
    if (room.status === "ended") throw new Error("Room has already ended");

    await ctx.db.patch(args.roomId, {
      status: "live",
      startedAt: Date.now(),
    });
  },
});

export const endRoom = mutation({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Only the room owner can end the room");
    }

    await ctx.db.patch(args.roomId, {
      status: "ended",
      endedAt: Date.now(),
    });
  },
});

export const sendLiveMessage = mutation({
  args: {
    roomId: v.id("liveRooms"),
    text: v.string(),
    type: v.optional(v.union(v.literal("chat"), v.literal("purchase"), v.literal("system"))),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    const text = args.text.trim();
    if (!text) throw new Error("Message cannot be empty");
    if (text.length > 500) throw new Error("Message too long (max 500 characters)");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "live") throw new Error("Room is not live");

    await ctx.db.insert("liveMessages", {
      roomId: args.roomId,
      userId: user._id,
      text,
      type: args.type ?? "chat",
      createdAt: Date.now(),
    });
  },
});

export const joinRoom = mutation({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Prevent duplicate joins — check if user already has a recent join message
    const recentJoin = await ctx.db
      .query("liveMessages")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("type"), "system"),
          q.gte(q.field("createdAt"), Date.now() - 60000) // within last minute
        )
      )
      .first();
    if (recentJoin) return; // Already joined

    await ctx.db.patch(args.roomId, {
      viewerCount: room.viewerCount + 1,
    });

    await ctx.db.insert("liveMessages", {
      roomId: args.roomId,
      userId: user._id,
      text: "joined the room",
      type: "system",
      createdAt: Date.now(),
    });
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("liveRooms") },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, {
      viewerCount: Math.max(0, room.viewerCount - 1),
    });
  },
});
