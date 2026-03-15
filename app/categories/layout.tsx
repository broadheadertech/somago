import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Categories",
  description: "Explore product categories on Somago — Electronics, Fashion, Home & Living, Health & Beauty, and more.",
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
