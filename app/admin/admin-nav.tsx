// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Sellers", href: "/admin/sellers", icon: "🏪" },
  { label: "Users", href: "/admin/users", icon: "👥" },
  { label: "Moderation", href: "/admin/moderation", icon: "🛡️" },
  { label: "Disputes", href: "/admin/disputes", icon: "⚖️" },
  { label: "Flash Sales", href: "/admin/flash-sales", icon: "⚡" },
  { label: "Content", href: "/admin/content", icon: "📝" },
  { label: "Health", href: "/admin/health", icon: "🩺" },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-20 space-y-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-900">
            Admin Panel
          </p>
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-secondary-900 text-white font-medium"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
