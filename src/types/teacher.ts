// Teacher DTO mirror for Phase 16 screens (FE-127..FE-129).
//
// AssignmentStatus and SubmissionStatus are NUMERIC enums on the wire, not
// strings. The backend enums are serialized with System.Text.Json defaults —
// there is no JsonStringEnumConverter registered — so `status` is sent and
// received as an integer. Modeling them as string unions would produce wrong
// requests and broken comparisons. This mirrors the same decision made for
// `UserRole` in ./admin.

// Re-export so teacher screens import class/subject types from one place.
export type { ClassResponse, SubjectResponse } from "./admin";

// Domain.Enums.AssignmentStatus (Draft=0, Published=1, Closed=2).
export const AssignmentStatus = {
  Draft: 0,
  Published: 1,
  Closed: 2,
} as const;
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  [AssignmentStatus.Draft]: "Draft",
  [AssignmentStatus.Published]: "Published",
  [AssignmentStatus.Closed]: "Closed",
};

// Domain.Enums.SubmissionStatus
// (Submitted=0, Late=1, UnderReview=2, Graded=3, ReturnedForResubmission=4).
export const SubmissionStatus = {
  Submitted: 0,
  Late: 1,
  UnderReview: 2,
  Graded: 3,
  ReturnedForResubmission: 4,
} as const;
export type SubmissionStatus =
  (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  [SubmissionStatus.Submitted]: "Submitted",
  [SubmissionStatus.Late]: "Late",
  [SubmissionStatus.UnderReview]: "Under review",
  [SubmissionStatus.Graded]: "Graded",
  [SubmissionStatus.ReturnedForResubmission]: "Returned for resubmission",
};

// Application.Assignments.AssignmentResponse
export interface AssignmentResponse {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  allowResubmissionUntilDeadline: boolean;
  createdAt: string;
  updatedAt: string;
}

// Application.Assignments.Commands.CreateAssignment.CreateAssignmentCommand
export interface CreateAssignmentCommand {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  deadline: string;
  maxMarks: number;
  allowResubmissionUntilDeadline: boolean;
}

// Application.Assignments.Commands.UpdateAssignment.UpdateAssignmentCommand
export interface UpdateAssignmentCommand {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  deadline: string;
  maxMarks: number;
  allowResubmissionUntilDeadline: boolean;
}

// Application.Submissions.SubmissionResponse
export interface SubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  fileId: string;
  submittedAt: string;
  lastUpdatedAt: string;
  status: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  gradedByTeacherId: string | null;
  gradedAt: string | null;
}

// Application.Submissions.Commands.GradeSubmission.GradeSubmissionCommand
// (SubmissionId is taken from the route, not the body.)
export interface GradeSubmissionCommand {
  marks: number;
  feedback: string | null;
}

// Application.Submissions.Commands.ChangeSubmissionStatus.ChangeSubmissionStatusCommand
// (SubmissionId is taken from the route, not the body.)
export interface ChangeSubmissionStatusCommand {
  newStatus: SubmissionStatus;
}

// Application.Assignments.Queries.SearchAssignments.SearchAssignmentHit
export interface SearchAssignmentHit {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  className: string;
  teacherName: string;
  status: AssignmentStatus;
  deadline: string;
}

// Application.Assignments.Queries.SearchAssignments.SearchAssignmentsResult
export interface SearchAssignmentsResult {
  hits: SearchAssignmentHit[];
  totalMatches: number;
  take: number;
  skip: number;
}

export interface SearchAssignmentsParams {
  searchText?: string;
  status?: AssignmentStatus;
  take?: number;
  skip?: number;
}
