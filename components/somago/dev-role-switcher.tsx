// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export function DevRoleSwitcher() {
  const { isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe);
  const updateRole = useMutation(api.users.devSwitchRole);

  if (!isSignedIn || !me || process.env.NODE_ENV === "production") return null;

  const handleSwitch = async (role: "buyer" | "seller" | "admin") => {
    try {
      await updateRole({ role });
      toast.success(`Switched to ${role}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to switch role");
    }
  };

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col gap-1 rounded-lg border border-border bg-white p-2 shadow-lg md:bottom-3">
      <p className="text-[10px] font-medium text-neutral-500 uppercase">Dev Mode</p>
      <p className="text-xs text-neutral-700 mb-1">Role: <span className="font-bold text-primary-600">{me.role}</span></p>
      {(["buyer", "seller", "admin"] as const).map((role) => (
        <button
          key={role}
          onClick={() => handleSwitch(role)}
          disabled={me.role === role}
          className={`rounded px-2 py-1 text-xs capitalize transition-colors ${
            me.role === role
              ? "bg-primary-100 text-primary-700 font-medium"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
