// @ts-nocheck
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Forward Clerk auth token so Convex can identify the user
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (token) {
    convex.setAuth(token);
  }

  try {
    const order = await convex.query(api.orders.getById, { orderId: orderId as any });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const orderIdShort = order._id.slice(-8).toUpperCase();

    const subtotal = order.items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );
    const shippingFee = order.shippingFee ?? 0;
    const voucherDiscount = order.voucherDiscount ?? 0;
    const finalTotal = order.finalTotal ?? order.totalAmount;

    const paymentMethodLabels: Record<string, string> = {
      cod: "Cash on Delivery",
      gcash: "GCash",
      maya: "Maya",
      card: "Credit/Debit Card",
      balance: "Somago Balance",
    };

    const itemsRows = order.items
      .map(
        (item: any, i: number) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
            ${esc(item.productName)}${item.variantLabel ? ` <span style="color: #6b7280; font-size: 12px;">(${esc(item.variantLabel)})</span>` : ""}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">&#8369;${item.unitPrice.toLocaleString()}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">&#8369;${(item.unitPrice * item.quantity).toLocaleString()}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${orderIdShort} - Somago</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #f9fafb; padding: 40px 20px; }
    .invoice { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; color: #16a34a; }
    .logo-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; color: #374151; }
    .invoice-meta p { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .info-row { display: flex; gap: 40px; margin-bottom: 28px; }
    .info-block { flex: 1; }
    .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; }
    .info-block p { font-size: 13px; color: #374151; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { padding: 10px 12px; background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    thead th:first-child { text-align: left; border-radius: 6px 0 0 6px; }
    thead th:last-child { text-align: right; border-radius: 0 6px 6px 0; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3) { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #374151; }
    .totals-row.discount { color: #dc2626; }
    .totals-row.total { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 700; }
    .footer { text-align: center; margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 13px; color: #6b7280; }
    .footer .thanks { font-size: 15px; font-weight: 600; color: #16a34a; margin-bottom: 6px; }
    @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">Somago</div>
        <div class="logo-sub">Your Southeast Asian Marketplace</div>
      </div>
      <div class="invoice-meta">
        <h2>Invoice</h2>
        <p>#${orderIdShort}</p>
        <p>${orderDate}</p>
      </div>
    </div>

    <div class="info-row">
      <div class="info-block">
        <h3>Bill To</h3>
        <p>
          ${esc(order.shippingAddress.fullName)}<br>
          ${esc(order.shippingAddress.phone)}<br>
          ${esc(order.shippingAddress.addressLine1)}${order.shippingAddress.addressLine2 ? ", " + esc(order.shippingAddress.addressLine2) : ""}<br>
          ${esc(order.shippingAddress.city)}, ${esc(order.shippingAddress.province)} ${esc(order.shippingAddress.postalCode)}
        </p>
      </div>
      <div class="info-block">
        <h3>Payment Method</h3>
        <p>${paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
        <h3 style="margin-top: 12px;">Payment Status</h3>
        <p style="text-transform: capitalize;">${order.paymentStatus}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>&#8369;${subtotal.toLocaleString()}</span>
      </div>
      <div class="totals-row">
        <span>Shipping</span>
        <span>${shippingFee > 0 ? "&#8369;" + shippingFee.toLocaleString() : "Free"}</span>
      </div>
      ${
        voucherDiscount > 0
          ? `<div class="totals-row discount">
              <span>Voucher Discount${order.voucherCode ? " (" + order.voucherCode + ")" : ""}</span>
              <span>-&#8369;${voucherDiscount.toLocaleString()}</span>
            </div>`
          : ""
      }
      <div class="totals-row total">
        <span>Total</span>
        <span>&#8369;${finalTotal.toLocaleString()}</span>
      </div>
    </div>

    <div class="footer">
      <p class="thanks">Thank you for shopping on Somago!</p>
      <p>If you have any questions about this invoice, please contact our support team.</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="somago-invoice-${orderIdShort}.html"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
