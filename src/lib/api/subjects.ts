import type {
  CreateSubjectCommand,
  SubjectResponse,
  UpdateSubjectCommand,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function listSubjects(
  tokenProvider: TokenProvider = () => null,
): Promise<SubjectResponse[]> {
  return apiFetch<SubjectResponse[]>(
    "/api/subjects",
    { method: "GET" },
    tokenProvider,
  );
}

export function createSubject(
  command: CreateSubjectCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<SubjectResponse> {
  return apiFetch<SubjectResponse>(
    "/api/subjects",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function updateSubject(
  command: UpdateSubjectCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<SubjectResponse> {
  return apiFetch<SubjectResponse>(
    `/api/subjects/${command.id}`,
    {
      method: "PUT",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function deleteSubject(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/subjects/${id}`,
    { method: "DELETE" },
    tokenProvider,
  );
}
