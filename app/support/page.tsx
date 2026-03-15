// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const CATEGORY_LABELS: Record<string, string> = {
  order: "Order Issue",
  payment: "Payment Issue",
  account: "Account Issue",
  product: "Product Issue",
  other: "Other",
};

export default function SupportPage() {
  return (
    <AuthGuard message="Please sign in to access support.">
      <SupportPageContent />
    </AuthGuard>
  );
}

function SupportPageContent() {
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Support</h1>
        {view === "list" && (
          <Button
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
            onClick={() => setView("new")}
          >
            New Ticket
          </Button>
        )}
        {view !== "list" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setView("list"); setSelectedTicketId(null); }}
          >
            Back to Tickets
          </Button>
        )}
      </div>

      {view === "list" && (
        <TicketList
          onSelect={(id) => { setSelectedTicketId(id); setView("detail"); }}
        />
      )}
      {view === "new" && (
        <NewTicketForm onCreated={() => setView("list")} />
      )}
      {view === "detail" && selectedTicketId && (
        <TicketDetail ticketId={selectedTicketId} />
      )}
    </div>
  );
}

function TicketList({ onSelect }: { onSelect: (id: string) => void }) {
  const tickets = useQuery(api.support.getMyTickets);

  if (tickets === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No support tickets"
        description="Need help? Create a new ticket and our team will assist you."
        icon={
          <svg className="h-8 w-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <button
          key={ticket._id}
          onClick={() => onSelect(ticket._id)}
          className="w-full rounded-lg border border-border bg-white p-3 text-left hover:border-primary-200 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {ticket.subject}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_STYLES[ticket.status]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-neutral-500">
                  {CATEGORY_LABELS[ticket.category]}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 ml-2 shrink-0">
              {new Date(ticket.createdAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function NewTicketForm({ onCreated }: { onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTicket = useMutation(api.support.createTicket);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket({
        subject: subject.trim(),
        category: category as any,
        message: message.trim(),
        orderId: orderId.trim() ? (orderId.trim() as any) : undefined,
      });
      toast.success("Ticket created successfully!");
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Subject</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          maxLength={100}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="order">Order Issue</option>
          <option value="payment">Payment Issue</option>
          <option value="account">Account Issue</option>
          <option value="product">Product Issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Order ID <span className="text-neutral-400">(optional)</span>
        </label>
        <Input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Related order ID if applicable"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail..."
          rows={5}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 hover:bg-primary-700"
      >
        {isSubmitting ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  );
}

function TicketDetail({ ticketId }: { ticketId: string }) {
  const messages = useQuery(api.support.getTicketMessages, { ticketId: ticketId as any });
  const replyToTicket = useMutation(api.support.replyToTicket);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      await replyToTicket({ ticketId: ticketId as any, message: reply.trim() });
      setReply("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reply");
    } finally {
      setIsSending(false);
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
    <div className="space-y-3">
      {/* Messages */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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
          placeholder="Type your reply..."
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={handleReply}
          disabled={isSending || !reply.trim()}
          className="self-end bg-primary-600 hover:bg-primary-700"
        >
          {isSending ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
