// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReportIssueFormProps {
  orderId: string;
  onSubmitted?: () => void;
}

const ISSUE_TYPES = [
  { value: "damaged", label: "Item Damaged", icon: "💔" },
  { value: "wrong_item", label: "Wrong Item Received", icon: "📦" },
  { value: "not_received", label: "Item Not Received", icon: "❌" },
] as const;

export function ReportIssueForm({ orderId, onSubmitted }: ReportIssueFormProps) {
  const createDispute = useMutation(api.disputes.create);
  const [issueType, setIssueType] = useState<"damaged" | "wrong_item" | "not_received">("damaged");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createDispute({
        orderId: orderId as any,
        issueType,
        description: description || undefined,
      });
      toast.success("Report submitted. Seller has 48 hours to respond.");
      onSubmitted?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border-2 border-red-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Report an Issue</h3>

      <div className="space-y-2">
        {ISSUE_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setIssueType(type.value)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
              issueType === type.value
                ? "border-red-400 bg-red-50"
                : "border-border hover:border-red-300"
            }`}
          >
            <span className="text-lg">{type.icon}</span>
            <span className="text-neutral-900">{type.label}</span>
          </button>
        ))}
      </div>

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue (optional)..."
        rows={3}
      />

      <p className="text-xs text-neutral-500">
        Photo upload requires Convex file storage connection.
      </p>

      <Button
        className="w-full bg-red-600 hover:bg-red-700 text-white"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </Button>
    </div>
  );
}
