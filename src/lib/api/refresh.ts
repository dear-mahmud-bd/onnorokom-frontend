import { toast } from "sonner";
import { clearSession, getSessionSnapshot, saveSession } from "@/lib/auth/session";
import type { RefreshTokenResponse } from "@/types";

// Coordinates access-token renewal for the API client. When a request comes
// back 401, the client asks this module to swap the expired access token for a
// fresh one using the refresh token. If the refresh token is itself expired or
// invalid, the session is cleared so the UI logs the user out.

let inFlight: Promise<boolean> | null = null;

/**
 * Attempts to renew the access token using the stored refresh token.
 * Returns true if a new access token was obtained (caller can retry), false if
 * there was nothing to refresh or the refresh token is no longer valid (in which
 * case the session has been cleared and the user is effectively logged out).
 *
 * Concurrent callers share a single in-flight refresh so a burst of 401s only
 * triggers one network round-trip.
 */
export function attemptTokenRefresh(): Promise<boolean> {
  if (!inFlight) {
    inFlight = runRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function runRefresh(): Promise<boolean> {
  const current = getSessionSnapshot();
  if (!current?.refreshToken) {
    // No session / nothing to refresh (e.g. an unauthenticated request 401'd).
    return false;
  }

  let response: Response;
  try {
    response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
  } catch {
    // Network blip — don't destroy the session over a transient failure; the
    // original 401 surfaces as an error and the next call can retry.
    return false;
  }

  if (!response.ok) {
    // The refresh token is expired/revoked — log out from the UI.
    clearSession();
    toast.error("Your session has expired. Please sign in again.");
    return false;
  }

  const data = (await response.json()) as RefreshTokenResponse;

  // getSessionSnapshot() again in case forceAction changed while in flight.
  const latest = getSessionSnapshot();
  saveSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    forceAction: latest?.forceAction ?? current.forceAction,
  });
  return true;
}
