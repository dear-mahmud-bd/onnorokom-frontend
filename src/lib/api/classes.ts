import type {
  ClassResponse,
  CreateClassCommand,
  UpdateClassCommand,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function listClasses(
  tokenProvider: TokenProvider = () => null,
): Promise<ClassResponse[]> {
  return apiFetch<ClassResponse[]>(
    "/api/classes",
    { method: "GET" },
    tokenProvider,
  );
}

export function createClass(
  command: CreateClassCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<ClassResponse> {
  return apiFetch<ClassResponse>(
    "/api/classes",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function updateClass(
  command: UpdateClassCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<ClassResponse> {
  return apiFetch<ClassResponse>(
    `/api/classes/${command.id}`,
    {
      method: "PUT",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function deleteClass(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/classes/${id}`,
    { method: "DELETE" },
    tokenProvider,
  );
}
