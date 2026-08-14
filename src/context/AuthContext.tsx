"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import {
  changePassword as changePasswordEndpoint,
  login as loginEndpoint,
  refresh as refreshEndpoint,
  verifyEmail as verifyEmailEndpoint,
} from "@/lib/api/auth";
import { isApiError, type TokenProvider } from "@/lib/api/client";
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
  login: (email: string, password: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginEndpoint(email, password);
    saveSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      forceAction: normalizeForceAction(response.forceAction),
    });
  }, []);

  const doLogout = useCallback(() => {
    clearSession();
  }, []);

  const doRefresh = useCallback(async () => {
    const current = getSessionSnapshot();
    if (!current) {
      throw new Error("No session to refresh");
    }

    try {
      const response = await refreshEndpoint(current.refreshToken);
      saveSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        forceAction: current.forceAction,
      });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        doLogout();
      }
      throw error;
    }
  }, [doLogout]);

  const refresh = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const refreshSession = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = doRefresh().finally(() => {
        refreshPromiseRef.current = null;
      });
    }
    return refreshPromiseRef.current;
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