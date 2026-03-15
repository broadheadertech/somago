import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminNav>{children}</AdminNav>;
}
