// Create-only. `UsersController` exposes POST /api/users only — there is no
// GET /api/users (list) and no deactivate endpoint. List/deactivate stay
// unavailable pending backend endpoints.
import type { CreateUserCommand, CreateUserResponse } from "@/types";
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
