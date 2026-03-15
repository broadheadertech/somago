"use client";

import { useState, useEffect, useCallback } from "react";

const COMPARE_KEY = "somago_compare";
const MAX_COMPARE = 3;

function getCompareIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(COMPARE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setCompareIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
}

export function useCompare() {
  const [compareIds, setCompareIdsState] = useState<string[]>([]);

  useEffect(() => {
    setCompareIdsState(getCompareIds());
  }, []);

  const addToCompare = useCallback((productId: string) => {
    const current = getCompareIds();
    if (current.includes(productId)) return current.length;
    if (current.length >= MAX_COMPARE) return -1; // full
    const updated = [...current, productId];
    setCompareIds(updated);
    setCompareIdsState(updated);
    return updated.length;
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    const current = getCompareIds();
    const updated = current.filter((id) => id !== productId);
    setCompareIds(updated);
    setCompareIdsState(updated);
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareIdsState([]);
  }, []);

  return { compareIds, addToCompare, removeFromCompare, clearCompare };
}
