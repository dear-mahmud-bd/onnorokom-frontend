import type {
  AssignmentResponse,
  CreateAssignmentCommand,
  SearchAssignmentsParams,
  SearchAssignmentsResult,
  UpdateAssignmentCommand,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

// GET /api/assignments requires classId; teacherId is optional and scopes the
// list to one teacher's assignments (the caller passes their own user id).
export function listAssignments(
  classId: string,
  teacherId?: string,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse[]> {
  const params = new URLSearchParams({ classId });
  if (teacherId) {
    params.set("teacherId", teacherId);
  }
  return apiFetch<AssignmentResponse[]>(
    `/api/assignments?${params.toString()}`,
    { method: "GET" },
    tokenProvider,
  );
}

// GET /api/assignments/mine (Student-only) returns the caller's own Published
// class assignments — the class-scoped browse list backing the student screen.
export function listMyAssignments(
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse[]> {
  return apiFetch<AssignmentResponse[]>(
    "/api/assignments/mine",
    { method: "GET" },
    tokenProvider,
  );
}

export function getAssignment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(
    `/api/assignments/${id}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function createAssignment(
  command: CreateAssignmentCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(
    "/api/assignments",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function updateAssignment(
  command: UpdateAssignmentCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(
    `/api/assignments/${command.id}`,
    {
      method: "PUT",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function deleteAssignment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/assignments/${id}`,
    { method: "DELETE" },
    tokenProvider,
  );
}

export function publishAssignment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(
    `/api/assignments/${id}/publish`,
    { method: "POST" },
    tokenProvider,
  );
}

// GET /api/assignments/search is authorized for any authenticated role. The
// search UI itself lands in Phase 18; this is the data-layer function.
export function searchAssignments(
  params: SearchAssignmentsParams = {},
  tokenProvider: TokenProvider = () => null,
): Promise<SearchAssignmentsResult> {
  const query = new URLSearchParams();
  if (params.searchText) {
    query.set("searchText", params.searchText);
  }
  if (params.status !== undefined) {
    query.set("status", String(params.status));
  }
  if (params.take !== undefined) {
    query.set("take", String(params.take));
  }
  if (params.skip !== undefined) {
    query.set("skip", String(params.skip));
  }
  const suffix = query.toString();
  return apiFetch<SearchAssignmentsResult>(
    suffix ? `/api/assignments/search?${suffix}` : "/api/assignments/search",
    { method: "GET" },
    tokenProvider,
  );
}
