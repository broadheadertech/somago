// @ts-nocheck
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Invisible component that ensures the Clerk user exists in Convex.
 * Runs once after sign-in — creates the user document if missing.
 */
export function UserSync() {
  const { isSignedIn } = useAuth();
  const ensureUser = useMutation(api.users.ensureUser);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      ensureUser().catch(() => {
        // Silently fail — user might already exist
        hasSynced.current = false;
      });
    }
  }, [isSignedIn, ensureUser]);

  return null;
}
