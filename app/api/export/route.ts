// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await session.getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }
  convex.setAuth(token);

  const type = request.nextUrl.searchParams.get("type");

  if (type === "orders") {
    try {
      const orders = await convex.query(api.orders.listSellerOrders);
      if (!orders || orders.length === 0) {
        return new NextResponse("No orders to export", { status: 404 });
      }

      const headers = ["Order ID", "Date", "Buyer", "Product", "Quantity", "Amount", "Status", "Payment"];
      const rows = orders.map((o: any) => [
        escapeCSV(o._id),
        escapeCSV(new Date(o.createdAt).toISOString()),
        escapeCSV(o.buyerName || "Unknown"),
        escapeCSV(o.items?.[0]?.name || ""),
        escapeCSV(o.items?.reduce((s: number, i: any) => s + i.quantity, 0)),
        escapeCSV(o.totalAmount),
        escapeCSV(o.orderStatus),
        escapeCSV(o.paymentMethod),
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="somago-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (type === "products") {
    try {
      const products = await convex.query(api.products.listSellerProducts);
      if (!products || products.length === 0) {
        return new NextResponse("No products to export", { status: 404 });
      }

      const headers = ["Product ID", "Name", "Price", "Original Price", "Stock", "Sold", "Rating", "Reviews", "Status"];
      const rows = products.map((p: any) => [
        escapeCSV(p._id),
        escapeCSV(p.name),
        escapeCSV(p.price),
        escapeCSV(p.originalPrice),
        escapeCSV(p.stock),
        escapeCSV(p.soldCount),
        escapeCSV(p.rating),
        escapeCSV(p.reviewCount),
        escapeCSV(p.status),
      ]);

      const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="somago-products-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid export type. Use ?type=orders or ?type=products" }, { status: 400 });
}
