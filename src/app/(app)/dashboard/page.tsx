"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const DETAILS: { label: string; value: (u: ReturnType<typeof useAuth>["user"]) => string }[] = [
  { label: "User ID", value: (u) => u?.id ?? "—" },
  { label: "Email", value: (u) => u?.email || "—" },
  { label: "Role", value: (u) => u?.role ?? "—" },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const isAdmin = user?.role === "Admin";
  const isTeacher = user?.role === "Teacher";
  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/15 via-background to-background"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />
          <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-2xl font-semibold text-accent-foreground shadow-sm">
                {initial}
              </span>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Signed in as {user?.role ?? "User"}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Welcome back{user?.email ? "," : ""}
                {user?.email ? (
                  <span className="block text-accent">{user.email}</span>
                ) : null}
              </h1>
              <p className="max-w-xl text-base text-muted">
                You are signed in. Role-specific dashboards arrive in a later
                phase.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Go to admin console
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : null}
              {isTeacher ? (
                <Link
                  href="/teacher"
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Go to teacher console
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Log out
              </button>
            </div>
          </div>
        </section>

        {/* Account details */}
        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Account
          </h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            {DETAILS.map((d) => (
              <div
                key={d.label}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  {d.label}
                </dt>
                <dd className="truncate font-medium text-foreground" title={d.value(user)}>
                  {d.value(user)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <Footer />

      <ConfirmDialog
        open={confirmSignOut}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={logout}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
