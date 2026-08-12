import { isApiError } from "@/lib/api/client";

interface ServerErrorBannerProps {
  error?: unknown;
}

export function ServerErrorBanner({ error }: ServerErrorBannerProps) {
  if (!error) {
    return null;
  }

  if (isApiError(error)) {
    const title = error.problem.title;
    const detail = error.problem.detail;

    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        <p className="font-medium">{title ?? "Request failed"}</p>
        {detail ? <p className="mt-1">{detail}</p> : null}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <p className="font-medium">
        Something went wrong. Check your connection and try again.
      </p>
    </div>
  );
}