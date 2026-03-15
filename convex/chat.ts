import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser, requireMutationAuth } from "./auth";
import { checkRateLimit } from "./rateLimit";

// ── Get or Create Conversation ─────────────────────────────────
export const getOrCreateConversation = mutation({
  args: {
    sellerId: v.id("users"),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (user._id === args.sellerId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    // Determine buyer and seller — current user is always the buyer side
    const buyerId = user._id;
    const sellerId = args.sellerId;

    // Check for existing conversation between these two users
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("buyerId", buyerId).eq("sellerId", sellerId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    // Also check reverse direction (user could be seller chatting with buyer)
    const existingReverse = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("buyerId", sellerId).eq("sellerId", buyerId)
      )
      .unique();

    if (existingReverse) {
      return existingReverse._id;
    }

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      buyerId,
      sellerId,
      productId: args.productId,
      lastMessageAt: now,
      lastMessagePreview: "",
      createdAt: now,
    });

    return conversationId;
  },
});

// ── Get Conversations ──────────────────────────────────────────
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Get conversations where user is buyer
    const asBuyer = await ctx.db
      .query("conversations")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id))
      .collect();

    // Get conversations where user is seller
    const asSeller = await ctx.db
      .query("conversations")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .collect();

    const allConversations = [...asBuyer, ...asSeller];

    // Sort by lastMessageAt descending
    allConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    // Enrich with other party info and unread count
    const enriched = await Promise.all(
      allConversations.map(async (conv) => {
        const otherUserId =
          conv.buyerId === user._id ? conv.sellerId : conv.buyerId;
        const otherUser = await ctx.db.get(otherUserId);

        // Count unread messages from other party (capped at 99)
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conv._id)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("senderId"), otherUserId),
              q.eq(q.field("isRead"), false)
            )
          )
          .take(99);

        return {
          ...conv,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar,
                shopName: otherUser.shopProfile?.shopName,
                role: otherUser.role,
              }
            : null,
          unreadCount: messages.length,
        };
      })
    );

    return enriched;
  },
});

// ── Get Messages ───────────────────────────────────────────────
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Validate user is a participant
    if (
      conversation.buyerId !== user._id &&
      conversation.sellerId !== user._id
    ) {
      throw new Error("Not authorized to view this conversation");
    }

    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);

    // Return in chronological order
    return messages.reverse();
  },
});

// ── Send Message ───────────────────────────────────────────────
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    // Rate limit: max 30 messages per minute
    const { allowed } = await checkRateLimit(ctx, user._id, "sendMessage", 30, 60 * 1000);
    if (!allowed) {
      throw new Error("You are sending messages too quickly. Please wait a moment.");
    }

    // Validate message text
    const text = args.text.trim();
    if (!text) throw new Error("Message cannot be empty");
    if (text.length > 2000) throw new Error("Message too long (max 2000 characters)");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Validate sender is a participant
    if (
      conversation.buyerId !== user._id &&
      conversation.sellerId !== user._id
    ) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    const now = Date.now();

    // Insert message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      text: args.text,
      isRead: false,
      createdAt: now,
    });

    // Update conversation
    const preview =
      args.text.length > 100 ? args.text.substring(0, 100) + "..." : args.text;
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
    });

    // Create notification for recipient
    const recipientId =
      conversation.buyerId === user._id
        ? conversation.sellerId
        : conversation.buyerId;

    await ctx.db.insert("notifications", {
      userId: recipientId,
      type: "system",
      title: "New message",
      body: `${user.name}: ${preview}`,
      data: { conversationId: args.conversationId },
      isRead: false,
      createdAt: now,
    });

    // Auto-reply: if recipient is a seller with auto-reply enabled
    // Skip if sender is also a seller (prevents infinite loop between sellers)
    const recipient = await ctx.db.get(recipientId);
    if (
      recipient &&
      recipient.role === "seller" &&
      user.role !== "seller" && // Prevent seller-to-seller auto-reply loops
      recipient.chatAutoReply?.enabled &&
      recipient.chatAutoReply?.message
    ) {
      // Cooldown: check if auto-reply was sent in last 60 seconds
      const recentAutoReply = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
        .filter((q) =>
          q.and(
            q.eq(q.field("senderId"), recipientId),
            q.eq(q.field("isAutoReply"), true),
            q.gte(q.field("createdAt"), now - 60000)
          )
        )
        .first();

      if (!recentAutoReply) {
        await ctx.scheduler.runAfter(1000, internal.chat.sendAutoReply, {
          conversationId: args.conversationId,
          sellerId: recipientId,
          message: recipient.chatAutoReply.message,
        });
      }
    }
  },
});

// ── Mark Conversation Read ─────────────────────────────────────
export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (
      conversation.buyerId !== user._id &&
      conversation.sellerId !== user._id
    ) {
      throw new Error("Not authorized");
    }

    // Find the other party's ID
    const otherUserId =
      conversation.buyerId === user._id
        ? conversation.sellerId
        : conversation.buyerId;

    // Mark all unread messages from the other party as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), otherUserId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }
  },
});

// ── Internal: Send Auto-Reply ─────────────────────────────────
export const sendAutoReply = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    sellerId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const now = Date.now();
    const preview =
      args.message.length > 100
        ? args.message.substring(0, 100) + "..."
        : args.message;

    // Insert auto-reply message (flagged to prevent loops)
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.sellerId,
      text: args.message,
      isAutoReply: true,
      isRead: false,
      createdAt: now,
    });

    // Update conversation preview
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: preview,
    });
  },
});
