// @ts-nocheck
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/somago/empty-state";
import { AuthGuard } from "@/components/somago/auth-guard";
import { useRouter } from "next/navigation";

const TYPE_ICONS: Record<string, string> = {
  order_update: "📦",
  new_order: "🛒",
  dispute_update: "⚖️",
  promotion: "🎉",
  seller_approved: "✅",
  system: "🔔",
};

export default function NotificationsPage() {
  return (
    <AuthGuard message="Please sign in to view your notifications.">
      <NotificationsPageContent />
    </AuthGuard>
  );
}

function NotificationsPageContent() {
  const router = useRouter();
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead({ notificationId: notification._id });
    }
    // Navigate based on notification type
    if (notification.data?.orderId) {
      router.push(`/orders/${notification.data.orderId}`);
    } else if (notification.data?.disputeId) {
      router.push("/orders");
    }
  };

  if (notifications === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Skeleton className="mb-4 h-8 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead({})}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You'll be notified about order updates, disputes, and more."
          icon={
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                notification.isRead
                  ? "hover:bg-neutral-50"
                  : "bg-primary-50 hover:bg-primary-100"
              }`}
            >
              <span className="mt-0.5 text-lg">
                {TYPE_ICONS[notification.type] ?? "🔔"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${
                      notification.isRead
                        ? "text-neutral-700"
                        : "font-medium text-neutral-900"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  )}
                </div>
                <p className="text-xs text-neutral-500">{notification.body}</p>
                <p className="mt-1 text-[10px] text-neutral-400">
                  {new Date(notification.createdAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
