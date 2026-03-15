// @ts-nocheck
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/somago/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

function formatDateLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useQuery(api.users.getMe);
  const messages = useQuery(api.chat.getMessages, {
    conversationId: id as any,
    limit: 50,
  });
  const conversations = useQuery(api.chat.getConversations);

  const sendMessage = useMutation(api.chat.sendMessage);
  const markRead = useMutation(api.chat.markConversationRead);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(0);

  // Find current conversation from the list to get other user info
  const currentConv = conversations?.find((c) => c._id === id);

  // Mark as read on load and when new messages arrive
  useEffect(() => {
    if (id && me) {
      markRead({ conversationId: id as any }).catch(() => {});
    }
  }, [id, me, messages?.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: prevMessageCountRef.current === 0 ? "instant" : "smooth" });
      prevMessageCountRef.current = messages.length;
    }
  }, [messages?.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        text: trimmed,
      });
      setText("");
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (messages === undefined || me === undefined) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const dateLabel = formatDateLabel(msg.createdAt);
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      groupedMessages.push({ date: dateLabel, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const otherUser = currentConv?.otherUser;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button
          onClick={() => router.push("/chat")}
          className="shrink-0 rounded-lg p-1 text-neutral-600 hover:bg-neutral-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
          {otherUser?.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            (otherUser?.shopName || otherUser?.name || "?")
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {otherUser?.shopName || otherUser?.name || "Chat"}
          </p>
          {otherUser?.role === "seller" && otherUser?.shopName && (
            <Link
              href={`/seller/${currentConv?.sellerId === me?._id ? currentConv?.buyerId : currentConv?.sellerId}`}
              className="text-xs text-primary-600 hover:underline"
            >
              View Shop
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-neutral-500">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="my-4 flex items-center justify-center">
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-medium text-neutral-500">
                {group.date}
              </span>
            </div>

            {/* Messages in this group */}
            {group.messages.map((msg) => {
              const isOwn = msg.senderId === me?._id;
              return (
                <div
                  key={msg._id}
                  className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      isOwn
                        ? "bg-primary-600 text-white"
                        : "bg-white border border-border text-neutral-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`mt-0.5 text-[10px] ${
                        isOwn ? "text-primary-200" : "text-neutral-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-border bg-white p-3 md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
            autoComplete="off"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="shrink-0 bg-primary-600 hover:bg-primary-700 px-3"
            size="icon"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <AuthGuard message="Sign in to view your messages.">
      <ChatRoom />
    </AuthGuard>
  );
}
