// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const suggestions = useQuery(
    api.products.searchSuggestions,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const showDropdown = isFocused && debouncedQuery.length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="pl-9 pr-8 bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          {suggestions === undefined ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              <span className="text-xs text-neutral-500">Searching...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-3 text-center text-xs text-neutral-500">
              No products found for "{debouncedQuery}"
            </div>
          ) : (
            <>
              {suggestions.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product._id}`}
                  onClick={() => { setIsFocused(false); setQuery(""); }}
                  className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-neutral-50"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-300">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-900">{product.name}</p>
                    <p className="text-xs font-medium text-primary-600">₱{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsFocused(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="block w-full border-t border-border px-3 py-2 text-center text-xs font-medium text-primary-600 hover:bg-primary-50"
              >
                See all results for "{query}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
