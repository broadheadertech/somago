import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/somago/app-shell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Somago — Shop & Sell in Southeast Asia",
    template: "%s | Somago",
  },
  description:
    "Somago is your trusted e-commerce marketplace for Southeast Asia. Shop thousands of products from local sellers with secure checkout, fast delivery, and buyer protection.",
  keywords: [
    "Somago",
    "e-commerce",
    "marketplace",
    "Philippines",
    "Southeast Asia",
    "online shopping",
    "buy and sell",
    "Filipino products",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Somago",
    title: "Somago — Shop & Sell in Southeast Asia",
    description:
      "Your trusted marketplace for Southeast Asia. Shop from local sellers with buyer protection and fast delivery.",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somago — Shop & Sell in Southeast Asia",
    description: "Your trusted marketplace for Southeast Asia.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#E11D48" />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" richColors />
        </Providers>
        {/* SW disabled temporarily for auth debugging */}
      </body>
    </html>
  );
}
