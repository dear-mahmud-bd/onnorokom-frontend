import type { ForceAction, JwtClaims } from "@/types";

export const SESSION_STORAGE_KEY = "assignment-system.session";

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  forceAction: ForceAction;
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64Url.padEnd(
      Math.ceil(base64Url.length / 4) * 4,
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function loadSession(): SessionData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionData>;
    if (
      typeof parsed.accessToken === "string" &&
      typeof parsed.refreshToken === "string" &&
      typeof parsed.forceAction === "string"
    ) {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        forceAction: parsed.forceAction as ForceAction,
      };
    }
    return null;
  } catch {
    return null;
  }
}

let cached: SessionData | null | undefined;
const listeners = new Set<() => void>();

export function getSessionSnapshot(): SessionData | null {
  if (cached === undefined) {
    cached = loadSession();
  }
  return cached;
}

export function subscribeSession(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function notifySessionChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function saveSession(session: SessionData): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  cached = session;
  notifySessionChanged();
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(SESSION_STORAGE_KEY);
  cached = null;
  notifySessionChanged();
}