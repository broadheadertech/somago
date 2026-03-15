import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";

export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return null;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // ── Total users (capped at 500 for count) ──────────────
    const users = await ctx.db.query("users").take(500);
    const totalUsers = users.length;

    // ── Recent orders (last 30 days, capped at 500) ────────
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .take(500);

    const orders24h = recentOrders.filter((o) => o.createdAt >= oneDayAgo);
    const orders7d = recentOrders.filter((o) => o.createdAt >= sevenDaysAgo);
    const orders30d = recentOrders.filter((o) => o.createdAt >= thirtyDaysAgo);

    // ── Active users (unique buyers from last 7d orders) ───
    const activeBuyerIds = new Set(orders7d.map((o) => o.buyerId));
    const activeUsers = activeBuyerIds.size;

    // ── GMV by time period (use finalTotal, fallback to totalAmount, skip 0) ──
    const calcGmv = (orders: typeof recentOrders) =>
      orders
        .filter((o) => o.orderStatus !== "cancelled")
        .reduce((sum, o) => {
          const amount = (o.finalTotal !== undefined && o.finalTotal > 0)
            ? o.finalTotal
            : o.totalAmount;
          return sum + amount;
        }, 0);

    const gmv24h = calcGmv(orders24h);
    const gmv7d = calcGmv(orders7d);
    const gmv30d = calcGmv(orders30d);

    // ── Active products (capped at 500) ────────────────────
    const activeProducts = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500);

    // ── Open disputes (capped at 100 each) ─────────────────
    const openDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(100);
    const escalatedDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "escalated"))
      .take(100);

    // ── Open support tickets (capped at 100 each) ──────────
    const openTickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(100);
    const inProgressTickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .take(100);

    // ── Pending seller applications (capped at 100) ────────
    const pendingSellers = await ctx.db
      .query("users")
      .withIndex("by_sellerStatus", (q) => q.eq("sellerStatus", "pending"))
      .take(100);

    // ── Active flash sales (capped at 50) ──────────────────
    const activeFlashSales = await ctx.db
      .query("flashSales")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(50);

    // ── Active live rooms (capped at 50) ───────────────────
    const liveRooms = await ctx.db
      .query("liveRooms")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .take(50);

    return {
      totalUsers,
      activeUsers,
      totalOrders24h: orders24h.length,
      totalOrders7d: orders7d.length,
      totalOrders30d: orders30d.length,
      gmv24h: Math.round(gmv24h * 100) / 100,
      gmv7d: Math.round(gmv7d * 100) / 100,
      gmv30d: Math.round(gmv30d * 100) / 100,
      activeProductsCount: activeProducts.length,
      openDisputesCount: openDisputes.length + escalatedDisputes.length,
      openTicketsCount: openTickets.length + inProgressTickets.length,
      pendingApplicationsCount: pendingSellers.length,
      activeFlashSalesCount: activeFlashSales.filter(
        (fs) => fs.startAt <= now && fs.endAt >= now
      ).length,
      activeLiveRoomsCount: liveRooms.length,
    };
  },
});
