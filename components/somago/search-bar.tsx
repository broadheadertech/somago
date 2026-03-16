// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

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
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
          <svg
            className="mr-2 h-4 w-4 shrink-0 text-white/50"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search brands and items"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="ml-2 shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          {suggestions === undefined ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
              <span className="text-sm text-neutral-500">Searching...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm text-neutral-500">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <>
              {suggestions.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product._id}`}
                  onClick={() => { setIsFocused(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-300 text-sm">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-800">{product.name}</p>
                    <p className="text-sm font-semibold text-primary-600">₱{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsFocused(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="block w-full border-t border-neutral-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                See all results &gt;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
