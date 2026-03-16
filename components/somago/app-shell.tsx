"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { ErrorBoundary } from "./error-boundary";
import { UserSync } from "./user-sync";
import { ReactNode } from "react";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <UserSync />
      <Header />
      <ErrorBoundary>
        <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      </ErrorBoundary>
      <BottomNav />
    </>
  );
}
