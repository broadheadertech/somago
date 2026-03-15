import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db.get(log.adminId);
        return {
          ...log,
          adminName: admin?.name ?? "Unknown Admin",
        };
      })
    );

    return enriched;
  },
});
