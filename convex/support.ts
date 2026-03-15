import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth, requireAdmin } from "./auth";

// ── User: Create a ticket ────────────────────────────────────────
export const createTicket = mutation({
  args: {
    subject: v.string(),
    category: v.union(
      v.literal("order"),
      v.literal("payment"),
      v.literal("account"),
      v.literal("product"),
      v.literal("other")
    ),
    message: v.string(),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (!args.subject.trim()) throw new Error("Subject is required");
    if (!args.message.trim()) throw new Error("Message is required");
    if (args.subject.length > 200) throw new Error("Subject too long (max 200 characters)");
    if (args.message.length > 2000) throw new Error("Message too long (max 2000 characters)");

    // Validate orderId exists and belongs to user
    if (args.orderId) {
      const order = await ctx.db.get(args.orderId);
      if (!order || (order.buyerId !== user._id && order.sellerId !== user._id)) {
        throw new Error("Invalid order reference");
      }
    }

    const now = Date.now();

    const ticketId = await ctx.db.insert("supportTickets", {
      userId: user._id,
      subject: args.subject.trim(),
      category: args.category,
      status: "open",
      priority: "medium",
      orderId: args.orderId,
      createdAt: now,
    });

    // Insert initial message
    await ctx.db.insert("ticketMessages", {
      ticketId,
      senderId: user._id,
      message: args.message.trim(),
      isStaff: false,
      createdAt: now,
    });

    return ticketId;
  },
});

// ── User: Get my tickets ─────────────────────────────────────────
export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("supportTickets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// ── Get messages for a ticket ────────────────────────────────────
export const getTicketMessages = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return [];

    // Only ticket owner or admin can view messages
    if (ticket.userId !== user._id && user.role !== "admin") return [];

    const messages = await ctx.db
      .query("ticketMessages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Enrich with sender names
    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name ?? "Unknown",
          senderAvatar: sender?.avatar,
        };
      })
    );
  },
});

// ── Reply to a ticket ────────────────────────────────────────────
export const replyToTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (!args.message.trim()) throw new Error("Message cannot be empty");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Only ticket owner or admin can reply
    if (ticket.userId !== user._id && user.role !== "admin") {
      throw new Error("Access denied");
    }

    const isStaff = user.role === "admin";

    await ctx.db.insert("ticketMessages", {
      ticketId: args.ticketId,
      senderId: user._id,
      message: args.message.trim(),
      isStaff,
      createdAt: Date.now(),
    });

    // If staff replies, auto-update status to in_progress if still open
    if (isStaff && ticket.status === "open") {
      await ctx.db.patch(args.ticketId, { status: "in_progress" });
    }
  },
});

// ── Admin: Update ticket status ──────────────────────────────────
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await ctx.db.patch(args.ticketId, { status: args.status });

    // Notify user of status change
    await ctx.db.insert("notifications", {
      userId: ticket.userId,
      type: "system",
      title: "Support Ticket Updated",
      body: `Your ticket "${ticket.subject}" has been marked as ${args.status.replace("_", " ")}.`,
      data: { ticketId: args.ticketId },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── Admin: List all tickets ──────────────────────────────────────
export const listAllTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    let tickets;
    if (args.status) {
      tickets = await ctx.db
        .query("supportTickets")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      tickets = await ctx.db.query("supportTickets").order("desc").collect();
    }

    // Enrich with user info
    return await Promise.all(
      tickets.map(async (ticket) => {
        const ticketUser = await ctx.db.get(ticket.userId);
        return {
          ...ticket,
          userName: ticketUser?.name ?? "Unknown",
          userEmail: ticketUser?.email ?? "",
        };
      })
    );
  },
});
