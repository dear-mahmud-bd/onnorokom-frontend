import Link from "next/link";

// RBAC 403. Reached only by an authenticated user whose role isn't allowed —
// RequireAuth (FE-111) redirects here. (Guests hitting a protected URL are sent
// to /login instead; both redirects live in resolveAuthRedirect, not here.)
export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="font-display text-5xl font-semibold tracking-tight text-accent">
          403
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Access denied
        </h1>
        <p className="text-sm text-muted">
          Your account role does not have permission to view that page.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="flex h-11 w-full max-w-xs items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
