import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

// Root-level 404 for unknown URLs. It lives outside the (marketing) group, so
// it renders the shared shell directly rather than inheriting the group layout.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex flex-1 items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-24">
          <span className="font-display text-6xl font-semibold tracking-tight text-accent sm:text-7xl">
            404
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            This page doesn&apos;t exist
          </h1>
          <p className="max-w-md text-base text-muted">
            The page you&apos;re looking for may have moved or never existed.
            Check the address, or head back to a known place.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Go home
            </Link>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
