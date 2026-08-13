// Admin user management. `UsersController` exposes POST /api/users (create),
// GET /api/users (list, optional ?role=) and POST /api/users/{id}/active
// (activate/deactivate).
import type {
  CreateUserCommand,
  CreateUserResponse,
  UserRole,
  UserSummaryResponse,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function createUser(
  command: CreateUserCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<CreateUserResponse> {
  return apiFetch<CreateUserResponse>(
    "/api/users",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function listUsers(
  tokenProvider: TokenProvider = () => null,
  role?: UserRole,
): Promise<UserSummaryResponse[]> {
  const query = role !== undefined ? `?role=${role}` : "";
  return apiFetch<UserSummaryResponse[]>(
    `/api/users${query}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function setUserActive(
  id: string,
  isActive: boolean,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/users/${id}/active`,
    {
      method: "POST",
      body: JSON.stringify({ isActive }),
    },
    tokenProvider,
  );
}
