// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/somago/product-card";
import { toast } from "sonner";
import Link from "next/link";

function PostComments({ postId }: { postId: string }) {
  const comments = useQuery(api.posts.getComments, { postId: postId as any });
  const addComment = useMutation(api.posts.addComment);
  const { isSignedIn } = useAuth();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({ postId: postId as any, text: text.trim() });
      setText("");
    } catch (e: any) {
      toast.error(e.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      {isSignedIn && (
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            className="bg-white text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            className="shrink-0 bg-primary-600 hover:bg-primary-700"
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "..." : "Post"}
          </Button>
        </div>
      )}

      {comments === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-neutral-400">No comments yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-600">
                {comment.userAvatar ? (
                  <img src={comment.userAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  comment.userName.charAt(0)
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900">{comment.userName}</span>
                <p className="text-xs text-neutral-700">{comment.text}</p>
                <p className="text-[10px] text-neutral-400">
                  {new Date(comment.createdAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePostForm({ onClose }: { onClose: () => void }) {
  const createPost = useMutation(api.posts.create);
  const myProducts = useQuery(api.products.listMyProducts);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await createPost({
        text: text.trim(),
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        productId: productId || undefined,
      });
      toast.success("Post created!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Create Post</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <Textarea
            placeholder="What do you want to share? *"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="bg-neutral-50"
          />

          <Input
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-neutral-50"
          />

          <Input
            placeholder="Video URL (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="bg-neutral-50"
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Link a Product (optional)</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-md border border-border bg-neutral-50 px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">No product linked</option>
              {myProducts?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} - ₱{p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full bg-primary-600 hover:bg-primary-700"
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { isSignedIn } = useAuth();
  const feed = useQuery(api.posts.getFeed, { limit: 20 });
  const toggleLike = useMutation(api.posts.toggleLike);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const me = useQuery(api.users.getMe);

  const isSeller = me?.role === "seller" && me?.sellerStatus === "approved";

  const handleToggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleLike = async (postId: string) => {
    if (!isSignedIn) {
      toast.error("Please sign in to like posts");
      return;
    }
    try {
      await toggleLike({ postId: postId as any });
    } catch (e: any) {
      toast.error(e.message || "Failed to like post");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24">
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Feed</h1>

      {feed === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="mb-3 h-16 w-full" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-neutral-500">No posts yet. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((post) => (
            <div key={post._id} className="rounded-xl border border-border bg-white overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4 pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600 overflow-hidden">
                  {post.userAvatar ? (
                    <img src={post.userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    post.userName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {post.shopName || post.userName}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {new Date(post.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Post Text */}
              <div className="px-4 pt-3">
                <p className="whitespace-pre-wrap text-sm text-neutral-800">{post.text}</p>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="mt-3">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full object-cover max-h-[500px]"
                  />
                </div>
              )}

              {/* Post Video */}
              {post.videoUrl && (
                <div className="mt-3">
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full max-h-[500px]"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Linked Product */}
              {post.product && (
                <div className="mx-4 mt-3">
                  <Link href={`/product/${post.product._id}`}>
                    <div className="flex gap-3 rounded-lg border border-border bg-neutral-50 p-2 transition-colors hover:bg-neutral-100">
                      {post.product.imageUrl && (
                        <img
                          src={post.product.imageUrl}
                          alt={post.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{post.product.name}</p>
                        <p className="text-sm font-bold text-primary-600">
                          ₱{post.product.price.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {post.product.soldCount.toLocaleString()} sold
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Like & Comment Actions */}
              <div className="flex items-center gap-4 px-4 py-3">
                <button
                  onClick={() => handleLike(post._id)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                >
                  <svg
                    className={`h-5 w-5 ${post.liked ? "fill-red-500 text-red-500" : "text-neutral-500"}`}
                    fill={post.liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className={`text-xs font-medium ${post.liked ? "text-red-500" : "text-neutral-500"}`}>
                    {post.likeCount}
                  </span>
                </button>

                <button
                  onClick={() => handleToggleComments(post._id)}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-xs font-medium">{post.commentCount}</span>
                </button>
              </div>

              {/* Inline Comments */}
              {expandedComments.has(post._id) && (
                <div className="px-4 pb-4">
                  <PostComments postId={post._id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Create Post Button for Sellers */}
      {isSeller && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 md:bottom-6"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create Post Modal */}
      {showCreate && <CreatePostForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}
