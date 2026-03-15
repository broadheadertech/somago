import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Check and enforce rate limiting for a user action.
 * If the window has expired, resets the counter.
 * If allowed, increments the count.
 *
 * @returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  userId: Id<"users">,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_userId_action", (q) =>
      q.eq("userId", userId).eq("action", action)
    )
    .first();

  if (!existing) {
    // First request — create entry
    await ctx.db.insert("rateLimits", {
      userId,
      action,
      count: 1,
      windowStart: now,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Check if window has expired
  if (now - existing.windowStart >= windowMs) {
    // Reset window
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Window still active
  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  const newCount = existing.count + 1;
  await ctx.db.patch(existing._id, { count: newCount });
  return { allowed: true, remaining: maxRequests - newCount };
}
