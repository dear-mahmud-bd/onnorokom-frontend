"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import {
  changePassword as changePasswordEndpoint,
  login as loginEndpoint,
  verifyEmail as verifyEmailEndpoint,
} from "@/lib/api/auth";
import { type TokenProvider } from "@/lib/api/client";
import { attemptTokenRefresh } from "@/lib/api/refresh";
import {
  clearSession,
  decodeJwt,
  getSessionSnapshot,
  saveSession,
  subscribeSession,
} from "@/lib/auth/session";
import {
  normalizeChangePasswordStatus,
  normalizeForceAction,
  normalizeVerifyEmailOtpStatus,
  resolveRoleClaim,
  type ForceAction,
  type JwtClaims,
} from "@/types";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "requires-action"
  | "authenticated";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  forceAction: ForceAction | null;
  login: (email: string, password: string) => Promise<ForceAction>;
  logout: () => void;
  refresh: () => Promise<void>;
  refreshSession: () => Promise<void>;
  verifyEmail: (code: string) => Promise<ForceAction>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(claims: JwtClaims | null): AuthUser | null {
  if (!claims || typeof claims.sub !== "string" || claims.sub.length === 0) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    role: resolveRoleClaim(claims),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const status: AuthStatus = !isHydrated
    ? "loading"
    : session
      ? session.forceAction === "None"
        ? "authenticated"
        : "requires-action"
      : "unauthenticated";

  const user: AuthUser | null =
    session && isHydrated ? toUser(decodeJwt(session.accessToken)) : null;

  const forceAction: ForceAction | null =
    session && session.forceAction !== "None" ? session.forceAction : null;

  const tokenProvider: TokenProvider = useCallback(
    () => getSessionSnapshot()?.accessToken ?? null,
    [],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<ForceAction> => {
      const response = await loginEndpoint(email, password);
      const nextForceAction = normalizeForceAction(response.forceAction);
      saveSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        forceAction: nextForceAction,
      });
      // Returned so the login page can route explicitly (URL-driven) rather than
      // depending on the persisted forceAction, which would otherwise trap the
      // /login route for a mid-setup account.
      return nextForceAction;
    },
    [],
  );

  const doLogout = useCallback(() => {
    clearSession();
  }, []);

  // Delegates to the shared coordinator (also used by the API client's
  // refresh-on-401 path) so there is a single refresh implementation. It clears
  // the session on an expired refresh token; surface a failure to callers.
  const doRefresh = useCallback(async () => {
    const ok = await attemptTokenRefresh();
    if (!ok) {
      throw new Error("Session refresh failed");
    }
  }, []);

  const refresh = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

  // attemptTokenRefresh already de-dupes concurrent refreshes internally.
  const refreshSession = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

  const verifyEmail = useCallback(
    async (code: string): Promise<ForceAction> => {
      const response = await verifyEmailEndpoint(code, tokenProvider);
      if (normalizeVerifyEmailOtpStatus(response.status) === "Verified") {
        const current = getSessionSnapshot();
        if (current) {
          // The backend tells us what's still owed after verifying: admin-created
          // accounts route on to ChangePassword, everyone else clears to None.
          const next = normalizeForceAction(response.nextAction);
          saveSession({ ...current, forceAction: next });
          return next;
        }
      }
      return getSessionSnapshot()?.forceAction ?? "None";
    },
    [tokenProvider],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const response = await changePasswordEndpoint(
        currentPassword,
        newPassword,
        tokenProvider,
      );
      if (normalizeChangePasswordStatus(response.status) === "Verified") {
        const current = getSessionSnapshot();
        if (current) {
          saveSession({ ...current, forceAction: "None" });
        }
      }
    },
    [tokenProvider],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      forceAction,
      login,
      logout: doLogout,
      refresh,
      refreshSession,
      verifyEmail,
      changePassword,
    }),
    [status, user, forceAction, login, doLogout, refresh, refreshSession, verifyEmail, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}