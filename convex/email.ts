import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const FROM_EMAIL = "Somago <noreply@somago.com>";

// Escape HTML to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Order Confirmation Email ──────────────────────────────────
export const sendOrderConfirmation = internalAction({
  args: {
    to: v.string(),
    buyerName: v.string(),
    orderId: v.string(),
    orderTotal: v.number(),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend not configured, skipping order confirmation email");
      return;
    }

    const itemsHtml = args.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #E7E5E4;">${item.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #E7E5E4;text-align:center;">x${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #E7E5E4;text-align:right;">₱${(item.price * item.quantity).toLocaleString()}</td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: `Order Confirmed — #${args.orderId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1C1917;">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Somago</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E7E5E4;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#059669;">Order Confirmed!</h2>
            <p style="margin:0 0 16px;color:#78716C;font-size:14px;">
              Hi ${escapeHtml(args.buyerName)}, your order has been placed successfully.
            </p>

            <div style="background:#FAFAF9;border-radius:8px;padding:16px;margin-bottom:16px;">
              <p style="margin:0 0 4px;font-size:12px;color:#78716C;">Order ID</p>
              <p style="margin:0;font-family:monospace;font-size:14px;font-weight:bold;">#${args.orderId.slice(-8).toUpperCase()}</p>
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
              <thead>
                <tr style="color:#78716C;font-size:12px;text-transform:uppercase;">
                  <th style="text-align:left;padding:8px 0;border-bottom:2px solid #E7E5E4;">Item</th>
                  <th style="text-align:center;padding:8px 0;border-bottom:2px solid #E7E5E4;">Qty</th>
                  <th style="text-align:right;padding:8px 0;border-bottom:2px solid #E7E5E4;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:2px solid #059669;">
              <span style="font-size:14px;font-weight:bold;">Total</span>
              <span style="font-size:18px;font-weight:bold;color:#059669;">₱${args.orderTotal.toLocaleString()}</span>
            </div>

            <p style="margin:16px 0 0;font-size:12px;color:#78716C;">
              Payment: ${args.paymentMethod.toUpperCase()} &middot; Estimated delivery: 3-5 business days
            </p>
          </div>
          <p style="text-align:center;font-size:11px;color:#D6D3D1;margin-top:16px;">
            Somago — Your marketplace for Southeast Asia
          </p>
        </div>
      `,
    });
  },
});

// ── Seller Application Decision Email ─────────────────────────
export const sendSellerApplicationDecision = internalAction({
  args: {
    to: v.string(),
    sellerName: v.string(),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend not configured, skipping seller decision email");
      return;
    }

    const isApproved = args.decision === "approved";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: isApproved
        ? "Your Somago Seller Account is Approved!"
        : "Update on Your Somago Seller Application",
      html: `
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1C1917;">
          <div style="background:${isApproved ? "#059669" : "#78716C"};padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Somago</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E7E5E4;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:${isApproved ? "#059669" : "#1C1917"};">
              ${isApproved ? "Welcome to Somago Sellers!" : "Application Update"}
            </h2>
            <p style="margin:0 0 16px;color:#78716C;font-size:14px;">
              Hi ${escapeHtml(args.sellerName)},
            </p>
            ${
              isApproved
                ? `<p style="margin:0 0 16px;font-size:14px;">
                    Your seller application has been approved! You can now start listing products and reach thousands of buyers.
                  </p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="#" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
                      Go to Seller Dashboard
                    </a>
                  </div>`
                : `<p style="margin:0 0 16px;font-size:14px;">
                    Unfortunately, your seller application was not approved at this time.
                    ${args.reason ? `<br/><br/>Reason: ${escapeHtml(args.reason)}` : ""}
                  </p>
                  <p style="margin:0;font-size:14px;color:#78716C;">
                    You can resubmit your application with updated information.
                  </p>`
            }
          </div>
          <p style="text-align:center;font-size:11px;color:#D6D3D1;margin-top:16px;">
            Somago — Your marketplace for Southeast Asia
          </p>
        </div>
      `,
    });
  },
});

// ── Dispute Resolution Email ──────────────────────────────────
export const sendDisputeResolution = internalAction({
  args: {
    to: v.string(),
    buyerName: v.string(),
    orderId: v.string(),
    resolution: v.union(v.literal("refund"), v.literal("replacement"), v.literal("rejected")),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend not configured, skipping dispute resolution email");
      return;
    }

    const subjects: Record<string, string> = {
      refund: "Refund Approved for Your Order",
      replacement: "Replacement Approved for Your Order",
      rejected: "Update on Your Dispute",
    };

    const bodies: Record<string, string> = {
      refund: `Your refund of <strong>₱${(args.amount ?? 0).toLocaleString()}</strong> has been credited to your Somago balance.`,
      replacement: `A replacement item will be shipped to you. You'll receive a tracking update soon.`,
      rejected: `After reviewing your case, we were unable to approve your dispute.${args.reason ? ` Reason: ${escapeHtml(args.reason)}` : ""}`,
    };

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: subjects[args.resolution],
      html: `
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1C1917;">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Somago</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E7E5E4;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;font-size:18px;">Dispute ${args.resolution === "rejected" ? "Update" : "Resolved"}</h2>
            <p style="margin:0 0 16px;color:#78716C;font-size:14px;">
              Hi ${escapeHtml(args.buyerName)}, regarding order <strong>#${args.orderId.slice(-8).toUpperCase()}</strong>:
            </p>
            <div style="background:#FAFAF9;border-radius:8px;padding:16px;margin-bottom:16px;font-size:14px;">
              ${bodies[args.resolution]}
            </div>
          </div>
          <p style="text-align:center;font-size:11px;color:#D6D3D1;margin-top:16px;">
            Somago — Your marketplace for Southeast Asia
          </p>
        </div>
      `,
    });
  },
});

// ── Order Status Update Email ─────────────────────────────────
export const sendOrderStatusUpdate = internalAction({
  args: {
    to: v.string(),
    buyerName: v.string(),
    orderId: v.string(),
    status: v.string(),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend not configured, skipping status update email");
      return;
    }

    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed by the seller and is being prepared.",
      packed: "Your order has been packed and is ready for shipping.",
      shipped: `Your order has been shipped!${args.trackingNumber ? ` Tracking: ${escapeHtml(args.trackingNumber)}` : ""}`,
      delivered: "Your order has been delivered. Enjoy your purchase!",
    };

    const message = statusMessages[args.status] ?? `Your order status has been updated to: ${args.status}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: `Order #${args.orderId.slice(-8).toUpperCase()} — ${args.status.charAt(0).toUpperCase() + args.status.slice(1)}`,
      html: `
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1C1917;">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:20px;">Somago</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E7E5E4;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;font-size:18px;">Order Update</h2>
            <p style="margin:0 0 16px;color:#78716C;font-size:14px;">Hi ${escapeHtml(args.buyerName)},</p>
            <div style="background:#ECFDF5;border-radius:8px;padding:16px;margin-bottom:16px;font-size:14px;color:#064E3B;">
              ${message}
            </div>
          </div>
          <p style="text-align:center;font-size:11px;color:#D6D3D1;margin-top:16px;">
            Somago — Your marketplace for Southeast Asia
          </p>
        </div>
      `,
    });
  },
});
