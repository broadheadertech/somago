// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMutationAuth, getCurrentUser } from "./auth";

export const getByProduct = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("productQuestions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(10);

    return await Promise.all(
      questions.map(async (question) => {
        const asker = await ctx.db.get(question.askerId);
        let answeredByName: string | undefined;
        if (question.answeredBy) {
          const answerer = await ctx.db.get(question.answeredBy);
          answeredByName = answerer?.name ?? "Seller";
        }
        return {
          ...question,
          askerName: asker?.name ?? "Anonymous",
          answeredByName,
        };
      })
    );
  },
});

export const ask = mutation({
  args: {
    productId: v.id("products"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    if (args.question.length === 0) {
      throw new Error("Question cannot be empty");
    }
    if (args.question.length > 500) {
      throw new Error("Question must be 500 characters or less");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.status === "removed") {
      throw new Error("Product not found");
    }

    return await ctx.db.insert("productQuestions", {
      productId: args.productId,
      askerId: user._id,
      question: args.question,
      createdAt: Date.now(),
    });
  },
});

export const answer = mutation({
  args: {
    questionId: v.id("productQuestions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationAuth(ctx);

    const answerText = args.answer.trim();
    if (answerText.length === 0) {
      throw new Error("Answer cannot be empty");
    }
    if (answerText.length > 1000) {
      throw new Error("Answer too long (max 1000 characters)");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const product = await ctx.db.get(question.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Only the product's seller (or admin) can answer — and seller must not be suspended
    if (product.sellerId !== user._id && user.role !== "admin") {
      throw new Error("Only the seller can answer questions about their products");
    }
    if (user.sellerStatus === "suspended") {
      throw new Error("Your account is suspended. You cannot answer questions.");
    }

    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answeredBy: user._id,
      answeredAt: Date.now(),
    });
  },
});
