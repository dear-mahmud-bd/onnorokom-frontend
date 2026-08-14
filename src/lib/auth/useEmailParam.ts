import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Reads the `?email=` query param that the login flow attaches when routing a
 * mid-setup account to verify-email / change-password. Uses useSyncExternalStore
 * (not useState-in-effect, which this project's lint rule forbids) so the value
 * is null during SSR and resolves on the client without cascading renders.
 */
export function useEmailParam(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("email"),
    () => null,
  );
}
