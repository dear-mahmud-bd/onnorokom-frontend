"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveAuthRedirect } from "@/lib/auth/redirect";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function GuardSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <span
        role="status"
        aria-label="Loading"
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300"
      />
    </div>
  );
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { status, forceAction, user } = useAuth();
  const router = useRouter();

  const target = resolveAuthRedirect(status, forceAction, user, allowedRoles);

  useEffect(() => {
    if (target !== null) {
      router.replace(target);
    }
  }, [target, router]);

  if (status === "loading" || target !== null) {
    return <GuardSpinner />;
  }

  return <>{children}</>;
}
