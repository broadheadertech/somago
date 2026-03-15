import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

export async function requireAuth(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function requireBuyer(ctx: QueryCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "buyer" && user.role !== "admin") {
    throw new Error("Buyer access required");
  }
  return user;
}

export async function requireSeller(ctx: QueryCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "seller" && user.role !== "admin") {
    throw new Error("Seller access required");
  }
  if (user.role === "seller" && user.sellerStatus !== "approved") {
    throw new Error("Seller account not approved");
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx) {
  const user = await requireAuth(ctx);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requireSellerOwnership(
  ctx: MutationCtx,
  sellerId: string
) {
  const user = await requireSeller(ctx);
  if (user.role !== "admin" && user._id.toString() !== sellerId) {
    throw new Error("You can only modify your own resources");
  }
  return user;
}
