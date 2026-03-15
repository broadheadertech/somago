// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { AuthGuard } from "@/components/somago/auth-guard";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-neutral-100 text-neutral-600",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  order: "Order",
  payment: "Payment",
  account: "Account",
  product: "Product",
  other: "Other",
};

export default function AdminSupportPage() {
  return (
    <AuthGuard message="Please sign in to manage support tickets." requiredRole="admin">
      <AdminSupportPageContent />
    </AuthGuard>
  );
}

function AdminSupportPageContent() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const tickets = useQuery(api.support.listAllTickets, {
    status: statusFilter || undefined,
  } as any);

  if (selectedTicketId) {
    return (
      <div className="space-y-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedTicketId(null)}
        >
          Back to All Tickets
        </Button>
        <AdminTicketDetail ticketId={selectedTicketId} />
      </div>
    );
  }

  if (tickets === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">
        Support Tickets ({tickets.length})
      </h1>

      {/* Status Filter */}
      <div className="flex gap-1">
        <span className="self-center text-xs font-medium text-neutral-500 mr-1">Status:</span>
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !statusFilter
              ? "bg-primary-600 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          All
        </button>
        {["open", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets"
          description="No tickets match the current filter."
          icon={
            <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket._id}
              onClick={() => setSelectedTicketId(ticket._id)}
              className="w-full rounded-lg border border-border bg-white p-4 text-left hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {ticket.userName} ({ticket.userEmail})
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={STATUS_STYLES[ticket.status]}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <Badge className={PRIORITY_STYLES[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                    <span className="text-xs text-neutral-400">
                      {CATEGORY_LABELS[ticket.category]}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 ml-2 shrink-0">
                  {new Date(ticket.createdAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminTicketDetail({ ticketId }: { ticketId: string }) {
  const messages = useQuery(api.support.getTicketMessages, { ticketId: ticketId as any });
  const replyToTicket = useMutation(api.support.replyToTicket);
  const updateStatus = useMutation(api.support.updateTicketStatus);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      await replyToTicket({ ticketId: ticketId as any, message: reply.trim() });
      setReply("");
      toast.success("Reply sent");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ ticketId: ticketId as any, status: status as any });
      toast.success(`Ticket marked as ${status.replace("_", " ")}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  if (messages === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Actions */}
      <div className="flex gap-2 flex-wrap">
        <span className="self-center text-xs font-medium text-neutral-500">Change status:</span>
        {["in_progress", "resolved", "closed"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(s)}
            className="text-xs"
          >
            {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`rounded-lg p-3 ${
              msg.isStaff
                ? "bg-primary-50 border border-primary-100 ml-4"
                : "bg-white border border-border mr-4"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-neutral-900">
                {msg.senderName}
              </span>
              {msg.isStaff && (
                <Badge className="bg-primary-100 text-primary-700 text-[10px]">Staff</Badge>
              )}
              <span className="text-[10px] text-neutral-400">
                {new Date(msg.createdAt).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      <div className="flex gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply as staff..."
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={handleReply}
          disabled={isSending || !reply.trim()}
          className="self-end bg-primary-600 hover:bg-primary-700"
        >
          {isSending ? "..." : "Reply"}
        </Button>
      </div>
    </div>
  );
}
