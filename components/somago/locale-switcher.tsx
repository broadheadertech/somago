// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, LOCALES, type Locale } from "@/lib/i18n";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const currentCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        aria-label="Change language and currency"
      >
        <span>{currentLocale.flag}</span>
        <span className="hidden sm:inline">{currentCurrency.code}</span>
        <svg className="h-3 w-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-white p-3 shadow-lg">
          {/* Language Section */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Language
          </p>
          <div className="mb-3 space-y-1">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  locale === l.code
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {locale === l.code && (
                  <svg className="ml-auto h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Currency Section */}
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Currency
            </p>
            <div className="space-y-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    currency === c.code
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="w-5 text-center font-medium">{c.symbol}</span>
                  <span>{c.code}</span>
                  <span className="text-xs text-neutral-400">- {c.label}</span>
                  {currency === c.code && (
                    <svg className="ml-auto h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline version for the account page (not a dropdown, just shows options directly) */
export function LocaleSwitcherInline() {
  const { locale, setLocale, t } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-3 mb-3">
        <svg className="h-5 w-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <div>
          <span className="text-sm font-medium text-neutral-900">{t("account.languageCurrency")}</span>
          <p className="text-xs text-neutral-500">{t("account.languageCurrencyDesc")}</p>
        </div>
      </div>

      {/* Language */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Language</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              locale === l.code
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-border text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Currency */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Currency</p>
      <div className="flex flex-wrap gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              currency === c.code
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-border text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span>{c.symbol}</span>
            <span>{c.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
