"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { studentAssignment } from "@/lib/api/graphql";
import { getSubmission, submissionFileUrl } from "@/lib/api/submissions";
import { sessionTokenProvider } from "@/lib/api/token";
import { getStoredSubmissionId } from "@/lib/student/submissionStore";
import {
  ASSIGNMENT_STATUS_LABEL,
  AssignmentStatus,
  SUBMISSION_STATUS_LABEL,
  SubmissionStatus,
  type AssignmentResponse,
  type SubmissionResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { SubmissionForm } from "@/components/student/SubmissionForm";

function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const tone =
    status === AssignmentStatus.Published
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : status === AssignmentStatus.Closed
        ? "border-border bg-surface-muted text-muted"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {ASSIGNMENT_STATUS_LABEL[status]}
    </span>
  );
}

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const tone =
    status === SubmissionStatus.Graded
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : status === SubmissionStatus.Late
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : status === SubmissionStatus.ReturnedForResubmission
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          : status === SubmissionStatus.UnderReview
            ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
            : "border-border bg-surface-muted text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {SUBMISSION_STATUS_LABEL[status]}
    </span>
  );
}

function filenameFromDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) {
    return fallback;
  }
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/"/g, "").trim());
    } catch {
      return fallback;
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() ?? fallback;
}

export default function StudentAssignmentDetailPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Computed at load time (not during render) so the deadline check stays pure.
  const [canResubmit, setCanResubmit] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const detail = await studentAssignment(assignmentId, sessionTokenProvider);
        if (!active) {
          return;
        }
        setAssignment(detail);
        setCanResubmit(
          !!detail.allowResubmissionUntilDeadline &&
            new Date(detail.deadline).getTime() >= Date.now(),
        );
        const storedId = getStoredSubmissionId(assignmentId);
        if (storedId) {
          try {
            const existing = await getSubmission(storedId, sessionTokenProvider);
            if (active) {
              setSubmission(existing);
            }
          } catch {
            // Stale/invalid stored id — treat as no known submission.
            if (active) {
              setSubmission(null);
            }
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [assignmentId]);

  const handleDownload = useCallback(async () => {
    if (!submission) {
      return;
    }
    setActionError(null);
    try {
      const token = sessionTokenProvider();
      const res = await fetch(submissionFileUrl(submission.id), {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setActionError("File unavailable.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = filenameFromDisposition(
        res.headers.get("content-disposition"),
        `submission-${submission.id}`,
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Could not download the file. Please try again.");
    }
  }, [submission]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/student/assignments"
        className="flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-4 w-4"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to assignments
      </Link>

      <SectionHeader
        title={assignment?.title ?? "Assignment"}
        description="Submit your work and track your grade."
      />

      <ServerErrorBanner error={loadError} />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : assignment ? (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <AssignmentStatusBadge status={assignment.status} />
              <span className="text-sm text-muted">
                Max marks{" "}
                <span className="font-medium text-foreground">
                  {assignment.maxMarks}
                </span>
              </span>
              <span className="text-sm text-muted">
                Deadline{" "}
                <span className="font-medium text-foreground">
                  {new Date(assignment.deadline).toLocaleString()}
                </span>
              </span>
            </div>
            {assignment.description ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {assignment.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Your submission
            </h2>

            {actionError ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {actionError}
              </div>
            ) : null}

            {submission ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <SubmissionStatusBadge status={submission.status} />
                  <span className="text-sm text-muted">
                    Marks{" "}
                    <span className="font-medium text-foreground">
                      {submission.marks == null
                        ? "Not graded yet"
                        : `${submission.marks} / ${assignment.maxMarks}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                  >
                    Download your file
                  </button>
                </div>
                {submission.feedback ? (
                  <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-muted/50 p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">
                      Feedback
                    </span>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {submission.feedback}
                    </p>
                  </div>
                ) : null}

                {canResubmit ? (
                  <div className="flex flex-col gap-3 border-t border-border pt-4">
                    <p className="text-sm text-muted">
                      Resubmission is open until the deadline.
                    </p>
                    <SubmissionForm
                      mode="resubmit"
                      assignmentId={assignmentId}
                      submissionId={submission.id}
                      onSuccess={setSubmission}
                    />
                  </div>
                ) : (
                  <p className="border-t border-border pt-4 text-sm text-muted">
                    Resubmission is not available for this assignment.
                  </p>
                )}
              </div>
            ) : (
              <SubmissionForm
                mode="submit"
                assignmentId={assignmentId}
                onSuccess={setSubmission}
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
