export type ForceAction = "None" | "ChangePassword" | "VerifyEmail";

// The backend serializes enums as integers (no JsonStringEnumConverter), so
// `forceAction` arrives as 0/1/2 rather than the string names. Normalize at the
// boundary — tolerate both, so this keeps working if the backend later switches
// to string enums. Order matches the backend `enum ForceAction`.
const FORCE_ACTIONS: ForceAction[] = ["None", "ChangePassword", "VerifyEmail"];

export function normalizeForceAction(value: unknown): ForceAction {
  if (typeof value === "number") {
    return FORCE_ACTIONS[value] ?? "None";
  }
  if (value === "None" || value === "ChangePassword" || value === "VerifyEmail") {
    return value;
  }
  return "None";
}

export type VerifyEmailOtpStatus = "Verified" | "InvalidCode" | "MaxAttemptsLocked";

export type ChangePasswordStatus =
  | "Verified"
  | "EmailNotVerified"
  | "InvalidCurrentPassword"
  | "PolicyViolation";

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  forceAction: ForceAction;
}

export interface RefreshTokenCommand {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface VerifyEmailOtpCommand {
  code: string;
}

export interface VerifyEmailOtpResponse {
  status: VerifyEmailOtpStatus;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  status: ChangePasswordStatus;
  failedRules: string[] | null;
}

export interface ApiErrorBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export type ProblemDetails = ApiErrorBody;

export interface JwtClaims {
  sub: string;
  email: string;
  role?: string;
  exp?: number;
  [claim: string]: unknown;
}

export const RoleClaimType =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function resolveRoleClaim(claims: JwtClaims): string | undefined {
  const direct = claims["role"];
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const interop = claims[RoleClaimType];
  return typeof interop === "string" && interop.length > 0 ? interop : undefined;
}