// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/somago/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function LiveRoomContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const me = useQuery(api.users.getMe);
  const room = useQuery(api.live.getRoom, roomId ? { roomId: roomId as any } : "skip");
  const messages = useQuery(api.live.getRoomMessages, roomId ? { roomId: roomId as any } : "skip");

  const sendMessage = useMutation(api.live.sendLiveMessage);
  const endRoom = useMutation(api.live.endRoom);
  const joinRoom = useMutation(api.live.joinRoom);
  const leaveRoom = useMutation(api.live.leaveRoom);

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isOwner = me && room && me._id === room.sellerId;

  // Join/leave room
  useEffect(() => {
    if (!roomId || !me || hasJoined) return;
    joinRoom({ roomId: roomId as any }).catch(() => {});
    setHasJoined(true);

    return () => {
      leaveRoom({ roomId: roomId as any }).catch(() => {});
    };
  }, [roomId, me, hasJoined]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        roomId: roomId as any,
        text: chatInput.trim(),
      });
      setChatInput("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleBuyNow = async (product: any) => {
    try {
      await sendMessage({
        roomId: roomId as any,
        text: `bought ${product.name}!`,
        type: "purchase",
      });
      toast.success(`Added to your interest! Visit the product page to complete purchase.`);
      window.open(`/product/${product._id}`, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleEndLive = async () => {
    try {
      await endRoom({ roomId: roomId as any });
      toast.success("Live session ended");
      router.push("/live");
    } catch (e: any) {
      toast.error(e.message || "Failed to end session");
    }
  };

  if (!room) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (room.status === "ended") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900">This live session has ended</h2>
        <Button onClick={() => router.push("/live")} className="bg-primary-600 hover:bg-primary-700">
          Browse Other Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/live")} className="shrink-0 text-neutral-500 hover:text-neutral-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">
              {room.seller?.avatar ? (
                <img src={room.seller.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                room.seller?.name?.charAt(0) ?? "S"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {room.seller?.shopProfile?.shopName ?? room.seller?.name}
              </p>
              <p className="text-xs text-neutral-500 truncate">{room.title}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {room.status === "live" && (
            <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
          )}
          <span className="flex items-center gap-1 text-sm text-neutral-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {room.viewerCount}
          </span>
          {isOwner && (
            <Button
              onClick={handleEndLive}
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              End Live
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 120px)" }}>
        {/* Main Area: Featured Products */}
        <div className="flex-1 overflow-y-auto p-4">
          {room.description && (
            <p className="mb-4 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
              {room.description}
            </p>
          )}

          <h3 className="mb-3 text-sm font-semibold text-neutral-700 uppercase tracking-wider">
            Featured Products
          </h3>

          {/* Horizontal scrollable on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible">
            {room.products?.map((product) => (
              <Card
                key={product._id}
                className="min-w-[200px] shrink-0 overflow-hidden lg:min-w-0"
              >
                <div className="aspect-square bg-neutral-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-medium text-neutral-900 line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary-600">
                      P{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-neutral-400 line-through">
                        P{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleBuyNow(product)}
                    size="sm"
                    className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Buy Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {(!room.products || room.products.length === 0) && (
            <p className="text-sm text-neutral-400 text-center py-8">
              No products featured yet
            </p>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l lg:w-96 bg-white">
          <div className="border-b px-4 py-2">
            <h3 className="text-sm font-semibold text-neutral-700">Live Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" style={{ minHeight: "200px" }}>
            {messages?.map((msg) => (
              <div key={msg._id} className="flex gap-2">
                {msg.type === "purchase" ? (
                  <div className="w-full rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm">
                    <span className="text-yellow-700">
                      {msg.userName} just {msg.text}
                    </span>
                  </div>
                ) : msg.type === "system" ? (
                  <div className="w-full text-center text-xs text-neutral-400 py-1">
                    {msg.text}
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                      {msg.userAvatar ? (
                        <img src={msg.userAvatar} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        msg.userName?.charAt(0) ?? "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-neutral-700">
                        {msg.userName}
                      </span>
                      <p className="text-sm text-neutral-600 break-words">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={!me || room.status !== "live"}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!chatInput.trim() || sending || !me || room.status !== "live"}
                size="sm"
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
            {!me && (
              <p className="mt-1 text-xs text-neutral-400 text-center">
                Sign in to chat
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveRoomPage() {
  return <LiveRoomContent />;
}
