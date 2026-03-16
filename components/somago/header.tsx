// @ts-nocheck
"use client";

import Link from "next/link";
import { SearchBar } from "./search-bar";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Header() {
  const { isSignedIn } = useAuth();
  const cartItems = useQuery(api.cart.get);
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const me = useQuery(api.users.getMe);
  const coins = me?.coins ?? 0;

  return (
    <header className="sticky top-0 z-40">
      {/* Search bar row */}
      <div className="bg-linear-to-r from-neutral-900 via-neutral-900 to-primary-800">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4">
          <Link href="/" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600">
            <span className="text-sm font-bold text-white">S</span>
          </Link>

          <div className="flex-1">
            <SearchBar />
          </div>

          <Link href="/cart" className="relative shrink-0 p-1 text-white/80 hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-0.5 text-[9px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          <Link href="/chat" className="shrink-0 p-1 text-white/80 hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>

          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton>
              <button className="shrink-0 rounded-full bg-primary-600 px-3 py-1 text-[11px] font-semibold text-white">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Quick info strip — bordered card */}
      <div className="bg-white px-3 py-2">
        <div className="mx-auto grid max-w-7xl grid-cols-3 rounded-lg border border-neutral-200 overflow-hidden">
          <Link href="/rewards" className="flex items-center gap-1.5 border-r border-neutral-200 px-3 py-2.5">
            <span className="text-sm">🪙</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900">{coins} Coins</p>
              <p className="text-[9px] text-neutral-400 truncate">Earn free coins!</p>
            </div>
          </Link>
          <Link href="/rewards" className="flex items-center gap-1.5 border-r border-neutral-200 px-3 py-2.5">
            <span className="text-sm">📅</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900">Check-in</p>
              <p className="text-[9px] text-neutral-400 truncate">Daily free coins!</p>
            </div>
          </Link>
          <Link href="/flash-sales" className="flex items-center gap-1.5 px-3 py-2.5">
            <span className="text-sm">🏷️</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900">Flash Deals</p>
              <p className="text-[9px] text-neutral-400 truncate">Up to ₱1,100 off</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
