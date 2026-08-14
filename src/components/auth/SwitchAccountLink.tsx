"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Lets a mid-setup account (verify-email / change-password) be abandoned so a
 * different user can sign in on the same browser: clears the current session,
 * then returns to /login. Without this a persisted "requires-action" session
 * would keep routing back to the setup screen.
 */
export function SwitchAccountLink() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
      Not you?{" "}
      <button
        type="button"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="font-medium text-accent transition-colors hover:underline"
      >
        Use a different account
      </button>
    </p>
  );
}
