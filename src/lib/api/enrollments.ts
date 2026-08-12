import type {
  CreateStudentClassEnrollmentCommand,
  StudentClassEnrollmentResponse,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function listEnrollments(
  filter: { studentId?: string; classId?: string } = {},
  tokenProvider: TokenProvider = () => null,
): Promise<StudentClassEnrollmentResponse[]> {
  const params = new URLSearchParams();
  if (filter.studentId) {
    params.set("studentId", filter.studentId);
  }
  if (filter.classId) {
    params.set("classId", filter.classId);
  }
  const query = params.toString();

  return apiFetch<StudentClassEnrollmentResponse[]>(
    `/api/student-enrollments${query ? `?${query}` : ""}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function createEnrollment(
  command: CreateStudentClassEnrollmentCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<StudentClassEnrollmentResponse> {
  return apiFetch<StudentClassEnrollmentResponse>(
    "/api/student-enrollments",
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function deleteEnrollment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<void> {
  return apiFetch<void>(
    `/api/student-enrollments/${id}`,
    { method: "DELETE" },
    tokenProvider,
  );
}
