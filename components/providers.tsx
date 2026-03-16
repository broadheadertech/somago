"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

if (!convex && typeof window !== "undefined") {
  console.warn(
    "[Somago] NEXT_PUBLIC_CONVEX_URL is not set. The app is running without a Convex backend. See .env.example for required variables."
  );
}

function ConvexWrapper({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <ConvexWrapper>
        <LanguageProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </LanguageProvider>
      </ConvexWrapper>
    </ClerkProvider>
  );
}
