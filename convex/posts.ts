import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, requireMutationAuth } from "./auth";
import { requireValidUrl } from "./utils";

export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const currentUser = await getCurrentUser(ctx);

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    return await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        let product = null;
        if (post.productId) {
          const p = await ctx.db.get(post.productId);
          if (p) {
            product = {
              _id: p._id,
              name: p.name,
              price: p.price,
              originalPrice: p.originalPrice,
              imageUrl: p.imageUrl,
              rating: p.rating,
              reviewCount: p.reviewCount,
              soldCount: p.soldCount,
            };
          }
        }

        let liked = false;
        if (currentUser) {
          const existingLike = await ctx.db
            .query("postLikes")
            .withIndex("by_userId_postId", (q) =>
              q.eq("userId", currentUser._id).eq("postId", post._id)
            )
            .first();
          liked = !!existingLike;
        }

        return {
          ...post,
          userName: user?.name ?? "Unknown",
          userAvatar: user?.avatar,
          shopName: user?.shopProfile?.shopName,
          product,
          liked,
        };
      })
    );
  },
});

export const getUserPosts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const currentUser = await getCurrentUser(ctx);

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);

        let product = null;
        if (post.productId) {
          const p = await ctx.db.get(post.productId);
          if (p) {
            product = {
              _id: p._id,
              name: p.name,
              price: p.price,
              originalPrice: p.originalPrice,
              imageUrl: p.imageUrl,
              rating: p.rating,
              reviewCount: p.reviewCount,
              soldCount: p.soldCount,
            };
          }
        }

        let liked = false;
        if (currentUser) {
          const existingLike = await ctx.db
            .query("postLikes")
            .withIndex("by_userId_postId", (q) =>
              q.eq("userId", currentUser._id).eq("postId", post._id)
            )
            .first();
          liked = !!existingLike;
        }

        return {
          ...post,
          userName: user?.name ?? "Unknown",
          userAvatar: user?.avatar,
          shopName: user?.shopProfile?.shopName,
          product,
          liked,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (user.role !== "seller" && user.role !== "admin") {
      throw new Error("Only sellers can create posts");
    }
    if (user.role === "seller" && user.sellerStatus !== "approved") {
      throw new Error("Seller account not approved");
    }

    if (!args.text.trim()) {
      throw new Error("Post text is required");
    }
    if (args.text.length > 2000) {
      throw new Error("Post text too long (max 2000 characters)");
    }

    // Validate URLs
    requireValidUrl(args.imageUrl, "image URL");
    requireValidUrl(args.videoUrl, "video URL");

    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      if (!product || product.sellerId !== user._id) {
        throw new Error("Product not found or does not belong to you");
      }
      if (product.status !== "active") {
        throw new Error("Cannot link to a non-active product");
      }
    }

    return await ctx.db.insert("posts", {
      userId: user._id,
      text: args.text.trim(),
      imageUrl: args.imageUrl,
      videoUrl: args.videoUrl,
      productId: args.productId,
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    const existing = await ctx.db
      .query("postLikes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("postLikes", {
        postId: args.postId,
        userId: user._id,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        likeCount: post.likeCount + 1,
      });
      return { liked: true };
    }
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (!args.text.trim()) {
      throw new Error("Comment text is required");
    }
    if (args.text.length > 500) {
      throw new Error("Comment must be 500 characters or less");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.insert("postComments", {
      postId: args.postId,
      userId: user._id,
      text: args.text.trim(),
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });
  },
});

export const getComments = query({
  args: {
    postId: v.id("posts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          userName: user?.name ?? "Unknown",
          userAvatar: user?.avatar,
        };
      })
    );
  },
});
