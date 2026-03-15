// @ts-nocheck
"use client";

import Link from "next/link";
import { SearchBar } from "./search-bar";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/somago/locale-switcher";
import { useTranslation } from "@/lib/i18n";

export function Header() {
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();
  const cartItems = useQuery(api.cart.get);
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-xl font-bold text-primary-600"
        >
          Somago
        </Link>

        {/* Search */}
        <div className="hidden flex-1 sm:block">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3">
          {/* Cart (desktop) */}
          <Link
            href="/cart"
            className="relative hidden text-neutral-700 hover:text-primary-600 md:block"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Wishlist (desktop) */}
          <Link
            href="/wishlist"
            className="relative hidden text-neutral-700 hover:text-primary-600 md:block"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>

          {/* Notifications (desktop) */}
          <Link
            href="/notifications"
            className="relative hidden text-neutral-700 hover:text-primary-600 md:block"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Locale Switcher */}
          <LocaleSwitcher />

          {/* Auth */}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton>
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                {t("common.signIn")}
              </Button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-border px-4 py-2 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
