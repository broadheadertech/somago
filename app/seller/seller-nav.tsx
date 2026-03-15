// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sellerNav = [
  { label: "Dashboard", href: "/seller/dashboard", icon: "📊" },
  { label: "Products", href: "/seller/products", icon: "📦" },
  { label: "Orders", href: "/seller/orders", icon: "📋" },
  { label: "Promotions", href: "/seller/promotions", icon: "📢" },
  { label: "Analytics", href: "/seller/analytics", icon: "📈" },
];

export function SellerNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-20 space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-700">
            Seller Center
          </p>
          {sellerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-secondary-700 text-white font-medium"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-white md:hidden">
        <div className="flex items-center justify-around">
          {sellerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium",
                pathname.startsWith(item.href) ? "text-secondary-700" : "text-neutral-500"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
