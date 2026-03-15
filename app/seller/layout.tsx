import { SellerNav } from "./seller-nav";

export const dynamic = "force-dynamic";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerNav>{children}</SellerNav>;
}
