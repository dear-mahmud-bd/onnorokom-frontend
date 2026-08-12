import type {
  ChangePasswordResponse,
  LoginResponse,
  RefreshTokenResponse,
  VerifyEmailOtpResponse,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  return apiFetch<RefreshTokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function verifyEmail(
  code: string,
  tokenProvider: TokenProvider = () => null,
): Promise<VerifyEmailOtpResponse> {
  return apiFetch<VerifyEmailOtpResponse>(
    "/api/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    tokenProvider,
  );
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  tokenProvider: TokenProvider = () => null,
): Promise<ChangePasswordResponse> {
  return apiFetch<ChangePasswordResponse>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    tokenProvider,
  );
}