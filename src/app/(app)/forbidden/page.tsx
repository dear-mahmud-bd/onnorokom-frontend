import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Your account role does not have permission to view that page.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
