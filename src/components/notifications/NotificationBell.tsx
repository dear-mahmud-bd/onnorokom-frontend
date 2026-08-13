"use client";

// Notification-bell dropdown for the student console. Shows an unread badge and
// a list of recent live notifications, each linking to its target screen.
// Consumes the FE-135 NotificationsProvider.
import { useState } from "react";
import Link from "next/link";
import { useNotifications } from "@/context/NotificationsContext";
import type { RealtimeNotification } from "@/types";

function targetHref(item: RealtimeNotification): string {
  // GradePosted has no submission-detail route; the student reaches grades via
  // their assignments list (FE-133).
  return item.type === "AssignmentPublished"
    ? `/student/assignments/${item.payload.assignmentId}`
    : "/student/assignments";
}

function itemTitle(item: RealtimeNotification): string {
  return item.type === "AssignmentPublished"
    ? "New assignment published"
    : "Submission graded";
}

function itemDetail(item: RealtimeNotification): string {
  if (item.type === "AssignmentPublished") {
    return item.payload.title || "An assignment is now available.";
  }
  return item.payload.marks !== null
    ? `You scored ${item.payload.marks}.`
    : "Your submission has been reviewed.";
}

function formatTime(receivedAt: string): string {
  const date = new Date(receivedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// `align` controls which way the dropdown opens. Default "right" (right-aligned
// to the button) suits a top-right bell; pass "left" when the bell sits near the
// left edge — e.g. the desktop sidebar — so the panel opens rightward instead of
// spilling off the left of the screen.
export function NotificationBell({
  align = "right",
}: {
  align?: "left" | "right";
} = {}) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead();
      return next;
    });
  };

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-5 w-5"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={close}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className={`absolute ${align === "left" ? "left-0" : "right-0"} z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl`}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {notifications.length > 0 ? (
                <span className="text-xs text-muted">
                  {notifications.length}
                </span>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                You&apos;re all caught up. New assignments and grades will
                appear here.
              </div>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={targetHref(item)}
                      onClick={close}
                      className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {itemTitle(item)}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {formatTime(item.receivedAt)}
                        </span>
                      </span>
                      <span className="truncate text-xs text-muted">
                        {itemDetail(item)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
