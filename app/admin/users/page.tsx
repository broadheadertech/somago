// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/somago/auth-guard";

const ROLE_COLORS: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-800",
  seller: "bg-green-100 text-green-800",
  admin: "bg-purple-100 text-purple-800",
};

export default function AdminUsersPage() {
  return (
    <AuthGuard message="Please sign in to manage users." requiredRole="admin">
      <AdminUsersPageContent />
    </AuthGuard>
  );
}

function AdminUsersPageContent() {
  const users = useQuery(api.users.listAllUsers, {});
  const [search, setSearch] = useState("");

  if (users === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">
        User Management ({users.length})
      </h1>

      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-neutral-50">
            <tr>
              <th className="px-4 py-2 font-medium text-neutral-700">Name</th>
              <th className="hidden px-4 py-2 font-medium text-neutral-700 sm:table-cell">Email</th>
              <th className="px-4 py-2 font-medium text-neutral-700">Role</th>
              <th className="hidden px-4 py-2 font-medium text-neutral-700 md:table-cell">Joined</th>
              <th className="px-4 py-2 font-medium text-neutral-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user._id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{user.name}</p>
                  <p className="text-xs text-neutral-500 sm:hidden">{user.email}</p>
                </td>
                <td className="hidden px-4 py-3 text-neutral-700 sm:table-cell">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_COLORS[user.role] ?? ""}>{user.role}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString("en-PH")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {user.sellerStatus === "suspended" ? (
                      <Badge className="bg-red-100 text-red-800">Suspended</Badge>
                    ) : user.strikeCount > 0 ? (
                      <Badge className="bg-yellow-100 text-yellow-800">{user.strikeCount} strike{user.strikeCount > 1 ? "s" : ""}</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-neutral-500">No users found</p>
        )}
      </div>
    </div>
  );
}
