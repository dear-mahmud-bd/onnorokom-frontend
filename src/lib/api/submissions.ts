// Submission API functions.
//
// Teacher/Admin operations: list, grade, change-status. Student operations
// (added for the Phase 17 student flow): submitAssignment, updateSubmission —
// both [Authorize(Roles = "Student,Admin")] and sent as multipart/form-data.
// getSubmission and submissionFileUrl are shared (owner/teacher/admin).

import type {
  ChangeSubmissionStatusCommand,
  GradeSubmissionCommand,
  SubmissionResponse,
} from "@/types";
import { apiFetch, type TokenProvider } from "./client";

export function listSubmissions(
  assignmentId: string,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse[]> {
  const params = new URLSearchParams({ assignmentId });
  return apiFetch<SubmissionResponse[]>(
    `/api/submissions?${params.toString()}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function getSubmission(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse> {
  return apiFetch<SubmissionResponse>(
    `/api/submissions/${id}`,
    { method: "GET" },
    tokenProvider,
  );
}

export function gradeSubmission(
  id: string,
  command: GradeSubmissionCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse> {
  return apiFetch<SubmissionResponse>(
    `/api/submissions/${id}/grade`,
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

export function changeSubmissionStatus(
  id: string,
  command: ChangeSubmissionStatusCommand,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse> {
  return apiFetch<SubmissionResponse>(
    `/api/submissions/${id}/status`,
    {
      method: "POST",
      body: JSON.stringify(command),
    },
    tokenProvider,
  );
}

// Student: submit a file for an assignment. Sent as multipart/form-data —
// apiFetch leaves content-type unset for FormData so the browser adds the
// boundary. Field names match the backend SubmitAssignmentForm binding.
export function submitAssignment(
  assignmentId: string,
  file: File,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse> {
  const form = new FormData();
  form.append("assignmentId", assignmentId);
  form.append("file", file);
  return apiFetch<SubmissionResponse>(
    "/api/submissions",
    { method: "POST", body: form },
    tokenProvider,
  );
}

// Student: replace the file on an existing submission (resubmit).
export function updateSubmission(
  id: string,
  file: File,
  tokenProvider: TokenProvider = () => null,
): Promise<SubmissionResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<SubmissionResponse>(
    `/api/submissions/${id}`,
    { method: "PUT", body: form },
    tokenProvider,
  );
}

// The file download is a plain proxied URL; callers use it as an <a href> or
// fetch it as a blob when the Bearer header must be attached.
export function submissionFileUrl(id: string): string {
  return `/api/submissions/${id}/file`;
}
