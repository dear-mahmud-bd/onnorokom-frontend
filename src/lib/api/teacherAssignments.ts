import type {
  CreateTeacherSubjectClassAssignmentCommand,
  TeacherSubjectClassAssignmentResponse,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function listTeacherAssignments(
  teacherId?: string,
  tokenProvider: TokenProvider = () => null,
): Promise<TeacherSubjectClassAssignmentResponse[]> {
  const params = new URLSearchParams();
  if (teacherId) {
    params.set("teacherId", teacherId);
  }
  const query = params.toString();

  return apiFetch<TeacherSubjectClassAssignmentResponse[]>(
    `/api/teacher-subject-class${query ? `?${query}` : ""}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function createTeacherAssignment(
  command: CreateTeacherSubjectClassAssignmentCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<TeacherSubjectClassAssignmentResponse> {
  return apiFetch<TeacherSubjectClassAssignmentResponse>(
    "/api/teacher-subject-class",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function deleteTeacherAssignment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/teacher-subject-class/${id}`,
    { method: "DELETE" },
    tokenProvider,
  );
}
