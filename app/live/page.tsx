// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/somago/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";

function LiveRoomsContent() {
  const me = useQuery(api.users.getMe);
  const rooms = useQuery(api.live.getActiveRooms);
  const myProducts = useQuery(
    api.products.listMyProducts,
    me?.role === "seller" || me?.role === "admin" ? {} : "skip"
  );
  const createRoom = useMutation(api.live.createRoom);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const isSeller = me?.role === "seller" || me?.role === "admin";

  const liveRooms = rooms?.filter((r) => r.status === "live") ?? [];
  const scheduledRooms = rooms?.filter((r) => r.status === "scheduled") ?? [];

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      const roomId = await createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
        featuredProducts: selectedProducts as any,
      });
      setShowCreateDialog(false);
      setTitle("");
      setDescription("");
      setSelectedProducts([]);
      toast.success("You are now live!");
      window.location.href = `/live/${roomId}`;
    } catch (e: any) {
      toast.error(e.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Live Selling</h1>
          <p className="text-sm text-neutral-500">
            Watch sellers showcase products in real-time
          </p>
        </div>
        {isSeller && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Go Live
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Start a Live Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700">Title</label>
                  <Input
                    placeholder="e.g. Summer Collection Sale!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Description (optional)</label>
                  <Textarea
                    placeholder="Tell viewers what to expect..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Featured Products ({selectedProducts.length} selected)
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {myProducts?.filter((p) => p.status === "active").map((product) => (
                      <button
                        key={product._id}
                        onClick={() => toggleProduct(product._id)}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors ${
                          selectedProducts.includes(product._id)
                            ? "border-primary-600 bg-primary-50"
                            : "border-border hover:bg-neutral-50"
                        }`}
                      >
                        <div className="h-8 w-8 shrink-0 rounded bg-neutral-100 overflow-hidden">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-xs text-neutral-500">P{product.price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {(!myProducts || myProducts.filter((p) => p.status === "active").length === 0) && (
                    <p className="mt-2 text-sm text-neutral-400">No active products found</p>
                  )}
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !title.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {creating ? "Going Live..." : "Go Live Now"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Live Now */}
      {liveRooms.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveRooms.map((room) => (
              <Link key={room._id} href={`/live/${room._id}`}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer">
                  <div className="relative bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white">
                    <Badge className="absolute right-3 top-3 bg-red-600 text-white animate-pulse">
                      LIVE
                    </Badge>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-bold text-lg">
                        {room.seller?.avatar ? (
                          <img src={room.seller.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          room.seller?.name?.charAt(0) ?? "S"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{room.title}</p>
                        <p className="text-sm text-white/80 truncate">
                          {room.seller?.shopProfile?.shopName ?? room.seller?.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {room.viewerCount} watching
                      </span>
                      <span>{room.featuredProducts.length} products</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduledRooms.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Upcoming</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scheduledRooms.map((room) => (
              <Card key={room._id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Scheduled
                    </Badge>
                    {room.scheduledAt && (
                      <span className="text-xs text-neutral-500">
                        {new Date(room.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-neutral-900">{room.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{room.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold">
                      {room.seller?.avatar ? (
                        <img src={room.seller.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        room.seller?.name?.charAt(0) ?? "S"
                      )}
                    </div>
                    <span className="text-sm text-neutral-600">
                      {room.seller?.shopProfile?.shopName ?? room.seller?.name}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {rooms && liveRooms.length === 0 && scheduledRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">No live sessions right now</h3>
          <p className="mt-1 text-sm text-neutral-500">Check back later or follow your favorite sellers</p>
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  return <LiveRoomsContent />;
}
