// @ts-nocheck
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import React from "react";

// ─── Supported Locales ───────────────────────────────────────────────────────
export type Locale = "en" | "fil" | "id";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fil", label: "Filipino", flag: "🇵🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

// ─── Translations ────────────────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.feed": "Feed",
    "nav.categories": "Categories",
    "nav.cart": "Cart",
    "nav.orders": "Orders",
    "nav.account": "Account",
    "nav.wishlist": "Wishlist",
    "nav.notifications": "Notifications",
    "nav.sellOnSomago": "Sell on Somago",
    "nav.sellerDashboard": "Seller Dashboard",

    // Product
    "product.addToCart": "Add to Cart",
    "product.buyNow": "Buy Now",
    "product.outOfStock": "Out of Stock",
    "product.reviews": "Reviews",
    "product.rating": "Rating",
    "product.description": "Description",
    "product.specifications": "Specifications",
    "product.seller": "Seller",
    "product.quantity": "Quantity",
    "product.price": "Price",
    "product.sold": "sold",
    "product.freeShipping": "Free Shipping",

    // Cart
    "cart.empty": "Your cart is empty",
    "cart.total": "Total",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.checkout": "Proceed to Checkout",
    "cart.removeItem": "Remove",
    "cart.continueShopping": "Continue Shopping",

    // Checkout
    "checkout.placeOrder": "Place Order",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.paymentMethod": "Payment Method",
    "checkout.orderSummary": "Order Summary",
    "checkout.cod": "Cash on Delivery",
    "checkout.balance": "Somago Balance",

    // Orders
    "orders.myOrders": "My Orders",
    "orders.orderHistory": "Order History",
    "orders.trackOrder": "Track Order",
    "orders.cancelOrder": "Cancel Order",
    "orders.status.pending": "Pending",
    "orders.status.processing": "Processing",
    "orders.status.shipped": "Shipped",
    "orders.status.delivered": "Delivered",
    "orders.status.cancelled": "Cancelled",
    "orders.noOrders": "No orders yet",

    // Account
    "account.profile": "Profile",
    "account.addresses": "Delivery Addresses",
    "account.addAddress": "Add",
    "account.noAddresses": "No addresses saved yet",
    "account.signOut": "Sign Out",
    "account.balance": "Somago Balance",
    "account.balanceDesc": "Your refunds are credited here",
    "account.languageCurrency": "Language & Currency",
    "account.languageCurrencyDesc": "Choose your preferred language and currency",
    "account.saveAddress": "Save Address",
    "account.cancel": "Cancel",
    "account.setDefault": "Set as default address",
    "account.default": "Default",
    "account.remove": "Remove",
    "account.addNewAddress": "Add New Address",

    // Common
    "common.search": "Search products...",
    "common.signIn": "Sign In",
    "common.signUp": "Sign Up",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.viewAll": "View All",
    "common.seeMore": "See More",
    "common.noResults": "No results found",
    "common.back": "Back",
  },

  fil: {
    // Nav
    "nav.home": "Bahay",
    "nav.feed": "Feed",
    "nav.categories": "Mga Kategorya",
    "nav.cart": "Cart",
    "nav.orders": "Mga Order",
    "nav.account": "Account",
    "nav.wishlist": "Wishlist",
    "nav.notifications": "Mga Abiso",
    "nav.sellOnSomago": "Magbenta sa Somago",
    "nav.sellerDashboard": "Seller Dashboard",

    // Product
    "product.addToCart": "Idagdag sa Cart",
    "product.buyNow": "Bilhin Ngayon",
    "product.outOfStock": "Ubos na ang Stock",
    "product.reviews": "Mga Review",
    "product.rating": "Rating",
    "product.description": "Deskripsyon",
    "product.specifications": "Mga Detalye",
    "product.seller": "Nagbebenta",
    "product.quantity": "Dami",
    "product.price": "Presyo",
    "product.sold": "nabenta",
    "product.freeShipping": "Libreng Pagpapadala",

    // Cart
    "cart.empty": "Walang laman ang iyong cart",
    "cart.total": "Kabuuan",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Pagpapadala",
    "cart.checkout": "Mag-checkout",
    "cart.removeItem": "Alisin",
    "cart.continueShopping": "Magpatuloy sa Pamimili",

    // Checkout
    "checkout.placeOrder": "I-order na",
    "checkout.shippingAddress": "Address ng Pagpapadala",
    "checkout.paymentMethod": "Paraan ng Bayad",
    "checkout.orderSummary": "Buod ng Order",
    "checkout.cod": "Bayad sa Paghahatid",
    "checkout.balance": "Somago Balance",

    // Orders
    "orders.myOrders": "Mga Order Ko",
    "orders.orderHistory": "Kasaysayan ng Order",
    "orders.trackOrder": "I-track ang Order",
    "orders.cancelOrder": "I-cancel ang Order",
    "orders.status.pending": "Naghihintay",
    "orders.status.processing": "Pinoproseso",
    "orders.status.shipped": "Ipinadala na",
    "orders.status.delivered": "Naihatid na",
    "orders.status.cancelled": "Na-cancel",
    "orders.noOrders": "Wala pang order",

    // Account
    "account.profile": "Profile",
    "account.addresses": "Mga Address ng Paghahatid",
    "account.addAddress": "Dagdagan",
    "account.noAddresses": "Wala pang naka-save na address",
    "account.signOut": "Mag-sign Out",
    "account.balance": "Somago Balance",
    "account.balanceDesc": "Dito nai-credit ang iyong mga refund",
    "account.languageCurrency": "Wika at Pera",
    "account.languageCurrencyDesc": "Piliin ang iyong gustong wika at pera",
    "account.saveAddress": "I-save ang Address",
    "account.cancel": "Kanselahin",
    "account.setDefault": "Itakda bilang default na address",
    "account.default": "Default",
    "account.remove": "Alisin",
    "account.addNewAddress": "Magdagdag ng Bagong Address",

    // Common
    "common.search": "Maghanap ng mga produkto...",
    "common.signIn": "Mag-sign In",
    "common.signUp": "Mag-sign Up",
    "common.loading": "Naglo-load...",
    "common.error": "May nangyaring mali",
    "common.retry": "Subukan Muli",
    "common.save": "I-save",
    "common.cancel": "Kanselahin",
    "common.delete": "I-delete",
    "common.edit": "I-edit",
    "common.viewAll": "Tingnan Lahat",
    "common.seeMore": "Tingnan Pa",
    "common.noResults": "Walang resulta",
    "common.back": "Bumalik",
  },

  id: {
    // Nav
    "nav.home": "Beranda",
    "nav.feed": "Feed",
    "nav.categories": "Kategori",
    "nav.cart": "Keranjang",
    "nav.orders": "Pesanan",
    "nav.account": "Akun",
    "nav.wishlist": "Wishlist",
    "nav.notifications": "Notifikasi",
    "nav.sellOnSomago": "Jual di Somago",
    "nav.sellerDashboard": "Dashboard Penjual",

    // Product
    "product.addToCart": "Tambah ke Keranjang",
    "product.buyNow": "Beli Sekarang",
    "product.outOfStock": "Stok Habis",
    "product.reviews": "Ulasan",
    "product.rating": "Penilaian",
    "product.description": "Deskripsi",
    "product.specifications": "Spesifikasi",
    "product.seller": "Penjual",
    "product.quantity": "Jumlah",
    "product.price": "Harga",
    "product.sold": "terjual",
    "product.freeShipping": "Gratis Ongkir",

    // Cart
    "cart.empty": "Keranjang Anda kosong",
    "cart.total": "Total",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Pengiriman",
    "cart.checkout": "Lanjut ke Pembayaran",
    "cart.removeItem": "Hapus",
    "cart.continueShopping": "Lanjut Belanja",

    // Checkout
    "checkout.placeOrder": "Buat Pesanan",
    "checkout.shippingAddress": "Alamat Pengiriman",
    "checkout.paymentMethod": "Metode Pembayaran",
    "checkout.orderSummary": "Ringkasan Pesanan",
    "checkout.cod": "Bayar di Tempat",
    "checkout.balance": "Saldo Somago",

    // Orders
    "orders.myOrders": "Pesanan Saya",
    "orders.orderHistory": "Riwayat Pesanan",
    "orders.trackOrder": "Lacak Pesanan",
    "orders.cancelOrder": "Batalkan Pesanan",
    "orders.status.pending": "Menunggu",
    "orders.status.processing": "Diproses",
    "orders.status.shipped": "Dikirim",
    "orders.status.delivered": "Terkirim",
    "orders.status.cancelled": "Dibatalkan",
    "orders.noOrders": "Belum ada pesanan",

    // Account
    "account.profile": "Profil",
    "account.addresses": "Alamat Pengiriman",
    "account.addAddress": "Tambah",
    "account.noAddresses": "Belum ada alamat tersimpan",
    "account.signOut": "Keluar",
    "account.balance": "Saldo Somago",
    "account.balanceDesc": "Pengembalian dana Anda dikreditkan di sini",
    "account.languageCurrency": "Bahasa & Mata Uang",
    "account.languageCurrencyDesc": "Pilih bahasa dan mata uang yang Anda inginkan",
    "account.saveAddress": "Simpan Alamat",
    "account.cancel": "Batal",
    "account.setDefault": "Jadikan alamat utama",
    "account.default": "Utama",
    "account.remove": "Hapus",
    "account.addNewAddress": "Tambah Alamat Baru",

    // Common
    "common.search": "Cari produk...",
    "common.signIn": "Masuk",
    "common.signUp": "Daftar",
    "common.loading": "Memuat...",
    "common.error": "Terjadi kesalahan",
    "common.retry": "Coba Lagi",
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.viewAll": "Lihat Semua",
    "common.seeMore": "Lihat Lagi",
    "common.noResults": "Tidak ada hasil",
    "common.back": "Kembali",
  },
};

// ─── Language Context ────────────────────────────────────────────────────────
interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

const LOCALE_STORAGE_KEY = "somago-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && translations[stored]) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations["en"]?.[key] ?? key;
    },
    [locale]
  );

  return React.createElement(
    LanguageContext.Provider,
    { value: { locale, setLocale, t } },
    children
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
