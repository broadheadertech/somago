// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "somago_recently_viewed";
const MAX_ITEMS = 20;

export function addRecentlyViewed(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewedIds();
    const filtered = existing.filter((id) => id !== productId);
    filtered.unshift(productId);
    const trimmed = filtered.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be unavailable
  }
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

export function useRecentlyViewed(): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getRecentlyViewedIds());
  }, []);

  return ids;
}
