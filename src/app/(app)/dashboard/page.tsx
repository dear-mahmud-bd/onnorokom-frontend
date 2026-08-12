"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You are signed in. Role-specific dashboards arrive in a later phase.
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <dt className="font-medium text-zinc-500 dark:text-zinc-400">User ID</dt>
        <dd className="text-zinc-900 dark:text-zinc-50">{user?.id ?? "—"}</dd>
        <dt className="font-medium text-zinc-500 dark:text-zinc-400">Email</dt>
        <dd className="text-zinc-900 dark:text-zinc-50">{user?.email || "—"}</dd>
        <dt className="font-medium text-zinc-500 dark:text-zinc-400">Role</dt>
        <dd className="text-zinc-900 dark:text-zinc-50">{user?.role ?? "—"}</dd>
      </dl>

      <button
        type="button"
        onClick={logout}
        className="flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Log out
      </button>
    </div>
  );
}
