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

// The backend serializes enums as integers (no JsonStringEnumConverter — same
// reason as `forceAction` above), so these `status` fields arrive as 0/1/2/...
// rather than the string names. Normalize at the boundary; tolerate both so
// this keeps working if the backend later switches to string enums. Order
// mirrors the C# `enum VerifyEmailOtpStatus` / `enum ChangePasswordStatus`.
const VERIFY_EMAIL_OTP_STATUSES: VerifyEmailOtpStatus[] = [
  "Verified",
  "InvalidCode",
  "MaxAttemptsLocked",
];

export function normalizeVerifyEmailOtpStatus(
  value: unknown,
): VerifyEmailOtpStatus | undefined {
  if (typeof value === "number") {
    return VERIFY_EMAIL_OTP_STATUSES[value];
  }
  if ((VERIFY_EMAIL_OTP_STATUSES as string[]).includes(value as string)) {
    return value as VerifyEmailOtpStatus;
  }
  return undefined;
}

const CHANGE_PASSWORD_STATUSES: ChangePasswordStatus[] = [
  "Verified",
  "EmailNotVerified",
  "InvalidCurrentPassword",
  "PolicyViolation",
];

export function normalizeChangePasswordStatus(
  value: unknown,
): ChangePasswordStatus | undefined {
  if (typeof value === "number") {
    return CHANGE_PASSWORD_STATUSES[value];
  }
  if ((CHANGE_PASSWORD_STATUSES as string[]).includes(value as string)) {
    return value as ChangePasswordStatus;
  }
  return undefined;
}

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
  // Where to route after a successful verify: "ChangePassword" for
  // admin-provisioned accounts that still owe a password change, else "None".
  // Serialized as an int by the backend — normalize with `normalizeForceAction`.
  nextAction: ForceAction;
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