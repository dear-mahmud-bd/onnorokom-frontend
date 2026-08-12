"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { TeacherNav } from "@/components/teacher/TeacherNav";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/teacher"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2 py-1"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-base font-semibold text-accent-foreground">
          O
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-base font-semibold text-foreground">
            Onnorokom
          </span>
          <span className="text-xs text-muted">Teacher console</span>
        </span>
      </Link>

      <TeacherNav onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-muted">
            {user?.email?.[0]?.toUpperCase() ?? "T"}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-foreground">
              {user?.email || "Teacher"}
            </span>
            <span className="text-xs text-muted">{user?.role ?? "Teacher"}</span>
          </span>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-4 w-4"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-4 w-4"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign out
        </button>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out"
        message="Are you sure you want to sign out of the teacher console?"
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}

export function TeacherShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-full bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Link href="/teacher" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
            O
          </span>
          <span className="font-display text-sm font-semibold text-foreground">
            Teacher console
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
            className="h-5 w-5"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={close}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border bg-surface shadow-xl">
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      ) : null}

      <main className="min-w-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
