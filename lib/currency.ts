// @ts-nocheck
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import React from "react";

// ─── Supported Currencies ────────────────────────────────────────────────────
export type CurrencyCode = "PHP" | "USD" | "IDR";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rate: number; // Exchange rate from PHP
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "PHP", symbol: "\u20B1", label: "Philippine Peso", rate: 1 },
  { code: "USD", symbol: "$", label: "US Dollar", rate: 0.018 },
  { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah", rate: 283 },
];

// ─── Price Formatting ────────────────────────────────────────────────────────
export function formatPrice(amountInPHP: number, currencyCode: CurrencyCode = "PHP"): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
  const converted = amountInPHP * currency.rate;

  if (currencyCode === "IDR") {
    // IDR typically has no decimals
    return `${currency.symbol}${Math.round(converted).toLocaleString("id-ID")}`;
  }

  if (currencyCode === "USD") {
    return `${currency.symbol}${converted.toFixed(2)}`;
  }

  // PHP
  return `${currency.symbol}${converted.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Currency Context ────────────────────────────────────────────────────────
interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  format: (amountInPHP: number) => string;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "PHP",
  setCurrency: () => {},
  format: (amount: number) => `\u20B1${amount}`,
  currencyInfo: CURRENCIES[0],
});

const CURRENCY_STORAGE_KEY = "somago-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("PHP");

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
    if (stored && CURRENCIES.find((c) => c.code === stored)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  }, []);

  const format = useCallback(
    (amountInPHP: number) => formatPrice(amountInPHP, currency),
    [currency]
  );

  const currencyInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return React.createElement(
    CurrencyContext.Provider,
    { value: { currency, setCurrency, format, currencyInfo } },
    children
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
