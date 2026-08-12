"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAssignment } from "@/lib/api/assignments";
import {
  changeSubmissionStatus,
  gradeSubmission,
  listSubmissions,
  submissionFileUrl,
} from "@/lib/api/submissions";
import { sessionTokenProvider } from "@/lib/api/token";
import type { GradeInput } from "@/lib/validation";
import {
  SUBMISSION_STATUS_LABEL,
  SubmissionStatus,
  type AssignmentResponse,
  type SubmissionResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { GradeDialog } from "@/components/teacher/GradeDialog";
import { StatusDialog } from "@/components/teacher/StatusDialog";

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const label = SUBMISSION_STATUS_LABEL[status];
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
      {label}
    </span>
  );
}

// Content-Disposition may carry the original filename; fall back to a safe name.
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

export default function TeacherSubmissionsPage() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [rows, setRows] = useState<SubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);

  const [gradeTarget, setGradeTarget] = useState<SubmissionResponse | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<SubmissionResponse | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRows(await listSubmissions(assignmentId, sessionTokenProvider));
  }, [assignmentId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [detail, submissions] = await Promise.all([
          getAssignment(assignmentId, sessionTokenProvider),
          listSubmissions(assignmentId, sessionTokenProvider),
        ]);
        if (active) {
          setAssignment(detail);
          setRows(submissions);
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

  const handleDownload = async (row: SubmissionResponse) => {
    setActionError(null);
    try {
      const token = sessionTokenProvider();
      const res = await fetch(submissionFileUrl(row.id), {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setActionError(
          res.status === 403
            ? "You can only download files for your own assignments."
            : "File unavailable.",
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = filenameFromDisposition(
        res.headers.get("content-disposition"),
        `submission-${row.id}`,
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
  };

  const handleGrade = async (values: GradeInput) => {
    if (!gradeTarget) {
      return;
    }
    setActionError(null);
    await gradeSubmission(
      gradeTarget.id,
      { marks: values.marks, feedback: values.feedback ?? null },
      sessionTokenProvider,
    );
    await refresh();
    setGradeTarget(null);
  };

  const handleStatus = async (newStatus: SubmissionStatus) => {
    if (!statusTarget) {
      return;
    }
    setActionError(null);
    await changeSubmissionStatus(
      statusTarget.id,
      { newStatus },
      sessionTokenProvider,
    );
    await refresh();
    setStatusTarget(null);
  };

  const columns: DataTableColumn<SubmissionResponse>[] = [
    {
      header: "Student",
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.studentId}</span>
      ),
    },
    {
      header: "Submitted at",
      render: (row) => new Date(row.submittedAt).toLocaleString(),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Marks",
      render: (row) =>
        row.marks == null
          ? "—"
          : `${row.marks} / ${assignment?.maxMarks ?? "?"}`,
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleDownload(row)}
            className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Download
          </button>
          <button
            type="button"
            onClick={() => setGradeTarget(row)}
            className="rounded-full px-3 py-1 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            Grade
          </button>
          <button
            type="button"
            onClick={() => setStatusTarget(row)}
            className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Change status
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/teacher/assignments"
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
        title={assignment?.title ?? "Submissions"}
        description={
          assignment
            ? `Max marks ${assignment.maxMarks} · Deadline ${new Date(
                assignment.deadline,
              ).toLocaleString()}`
            : "Review and grade student submissions."
        }
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </div>
      ) : null}

      <ServerErrorBanner error={loadError} />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyState="No submissions for this assignment yet."
        />
      )}

      {gradeTarget !== null && assignment ? (
        <GradeDialog
          submission={gradeTarget}
          maxMarks={assignment.maxMarks}
          onSubmit={handleGrade}
          onCancel={() => setGradeTarget(null)}
        />
      ) : null}

      {statusTarget !== null ? (
        <StatusDialog
          submission={statusTarget}
          onSubmit={handleStatus}
          onCancel={() => setStatusTarget(null)}
        />
      ) : null}
    </div>
  );
}
