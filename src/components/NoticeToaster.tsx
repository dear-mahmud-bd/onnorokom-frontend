"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Success messages are surfaced on the page you land on *after* a redirect,
 * not on the page you leave. Firing a toast right before `router.replace` (and,
 * on the password flow, a simultaneous `logout()`) races the teardown and the
 * toast is dropped. Instead each flow appends `?notice=<code>` and this global
 * listener fires the matching toast on arrival, then strips the param so a
 * refresh doesn't replay it.
 */
const NOTICES: Record<string, { message: string; description?: string }> = {
  "password-changed": {
    message: "Password changed.",
    description: "Please sign in with your new password.",
  },
  "email-verified": {
    message: "Email verified.",
    description: "Now set a new password to finish securing your account.",
  },
  "account-ready": {
    message: "Email verified — you're all set.",
  },
};

export function NoticeToaster() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = searchParams.get("notice");

  useEffect(() => {
    if (!notice) {
      return;
    }

    const entry = NOTICES[notice];
    if (entry) {
      // Stable id: a StrictMode double-mount updates the same toast instead of
      // stacking a duplicate.
      toast.success(entry.message, { id: notice, description: entry.description });
    }

    // Drop the param so a manual refresh doesn't replay the toast.
    router.replace(pathname, { scroll: false });
  }, [notice, pathname, router]);

  return null;
}
