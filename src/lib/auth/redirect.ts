import type { AuthStatus, AuthUser } from "@/context/AuthContext";
import type { ForceAction } from "@/types";

export type AuthRedirectTarget =
  | "/login"
  | "/verify-email"
  | "/change-password"
  | "/forbidden"
  | null;

/**
 * Pure mapping from session state to a redirect target.
 *
 * Returns `null` when the current route is allowed (or the decision cannot be
 * made yet, i.e. `loading` — the caller renders a spinner in that case).
 */
export function resolveAuthRedirect(
  status: AuthStatus,
  forceAction: ForceAction | null,
  user: AuthUser | null,
  allowedRoles?: string[],
): AuthRedirectTarget {
  switch (status) {
    case "loading":
      // Undecided — the guard shows a spinner rather than redirecting.
      return null;

    case "unauthenticated":
      return "/login";

    case "requires-action":
      switch (forceAction) {
        case "VerifyEmail":
          return "/verify-email";
        case "ChangePassword":
          return "/change-password";
        default:
          // Defensive: "requires-action" always carries a non-None forceAction.
          return "/login";
      }

    case "authenticated":
      if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
        return "/forbidden";
      }
      return null;

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
