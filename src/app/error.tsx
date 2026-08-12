"use client";

import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

// Root error boundary. Kept lean and self-contained (no interactive nav) so it
// stays robust when the app is in a broken state.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-24">
          <span className="font-display text-6xl font-semibold tracking-tight text-accent sm:text-7xl">
            Oops
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Something went wrong
          </h1>
          <p className="max-w-md text-base text-muted">
            An unexpected error occurred. You can try again, or head back home.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted">
              Reference:{" "}
              <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={reset}
              className="flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
