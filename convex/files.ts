import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMutationAuth } from "./auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMutationAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    return await Promise.all(
      args.storageIds.map(async (id) => ({
        storageId: id,
        url: await ctx.storage.getUrl(id),
      }))
    );
  },
});
