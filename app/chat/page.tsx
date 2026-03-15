// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/somago/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

function formatTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);
  const today = new Date();

  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;

  if (
    date.getDate() === today.getDate() - 1 &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function ConversationList() {
  const conversations = useQuery(api.chat.getConversations);

  if (conversations === undefined) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg
            className="h-8 w-8 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-neutral-900">
          No conversations yet
        </h2>
        <p className="max-w-sm text-sm text-neutral-500">
          Start a conversation by visiting a product page and clicking "Chat
          with Seller".
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <Link
          key={conv._id}
          href={`/chat/${conv._id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
        >
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
            {conv.otherUser?.avatar ? (
              <img
                src={conv.otherUser.avatar}
                alt={conv.otherUser.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              (conv.otherUser?.shopName || conv.otherUser?.name || "?")
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {conv.otherUser?.shopName || conv.otherUser?.name || "Unknown"}
              </p>
              <span className="shrink-0 text-[10px] text-neutral-400">
                {formatTime(conv.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-neutral-500">
                {conv.lastMessagePreview || "No messages yet"}
              </p>
              {conv.unreadCount > 0 && (
                <Badge className="ml-2 shrink-0 bg-primary-600 text-white text-[10px] px-1.5 py-0 min-w-[20px] flex items-center justify-center">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function ChatListPage() {
  return (
    <AuthGuard message="Sign in to view your messages.">
      <div className="mx-auto max-w-2xl pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
          <h1 className="text-lg font-bold text-neutral-900">Messages</h1>
        </div>

        <ConversationList />
      </div>
    </AuthGuard>
  );
}
