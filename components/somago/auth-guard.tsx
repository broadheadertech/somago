// @ts-nocheck
"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  message?: string;
  requiredRole?: "seller" | "admin";
}

export function AuthGuard({ children, message, requiredRole }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const me = useQuery(api.users.getMe);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Sign in required</h2>
        <p className="max-w-sm text-sm text-neutral-500">
          {message || "Please sign in to access this page."}
        </p>
        <SignInButton>
          <Button className="bg-primary-600 hover:bg-primary-700">
            Sign In
          </Button>
        </SignInButton>
      </div>
    );
  }

  // Role check
  if (requiredRole && me && me.role !== requiredRole && me.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Access Denied</h2>
        <p className="max-w-sm text-sm text-neutral-500">
          {requiredRole === "seller"
            ? "You need a seller account to access this page."
            : "You need admin access to view this page."}
        </p>
        {requiredRole === "seller" && (
          <Link href="/sell">
            <Button className="bg-primary-600 hover:bg-primary-700">
              Become a Seller
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
