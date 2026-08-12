"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  publishAssignment,
  updateAssignment,
} from "@/lib/api/assignments";
import { teacherClasses, teacherSubjects } from "@/lib/api/graphql";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import type { AssignmentInput } from "@/lib/validation";
import {
  AssignmentStatus,
  ASSIGNMENT_STATUS_LABEL,
  type AssignmentResponse,
  type ClassResponse,
  type SubjectResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { AssignmentFormDialog } from "@/components/teacher/AssignmentFormDialog";

interface DialogState {
  mode: "create" | "edit";
  target: AssignmentResponse | null;
}

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const label = ASSIGNMENT_STATUS_LABEL[status];
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
      {label}
    </span>
  );
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const teacherId = user?.id;

  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState<AssignmentResponse[]>([]);

  const [refLoading, setRefLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [listError, setListError] = useState<unknown>(null);

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentResponse | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );

  const classLabel = useCallback(
    (c: ClassResponse) => `${c.name} — ${c.gradeLevel}`,
    [],
  );

  // Load the reference data (classes + subjects) once via GraphQL — the only
  // teacher-reachable source, since REST /api/classes and /api/subjects are
  // Admin-only.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [classList, subjectList] = await Promise.all([
          teacherClasses(sessionTokenProvider),
          teacherSubjects(sessionTokenProvider),
        ]);
        if (active) {
          setClasses(classList);
          setSubjects(subjectList);
        }
      } catch (error) {
        if (active) {
          setLoadError(error);
        }
      } finally {
        if (active) {
          setRefLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadAssignments = useCallback(
    async (cid: string) => {
      if (!cid || !teacherId) {
        setRows([]);
        return;
      }
      setListLoading(true);
      setListError(null);
      try {
        setRows(await listAssignments(cid, teacherId, sessionTokenProvider));
      } catch (error) {
        setListError(error);
      } finally {
        setListLoading(false);
      }
    },
    [teacherId],
  );

  const refresh = useCallback(
    () => loadAssignments(classId),
    [loadAssignments, classId],
  );

  const handleSelectClass = async (value: string) => {
    setClassId(value);
    setActionError(null);
    await loadAssignments(value);
  };

  const handleSubmit = async (values: AssignmentInput) => {
    setActionError(null);
    const command = {
      title: values.title,
      description: values.description,
      subjectId: values.subjectId,
      classId: values.classId,
      deadline: new Date(values.deadline).toISOString(),
      maxMarks: values.maxMarks,
      allowResubmissionUntilDeadline: values.allowResubmissionUntilDeadline,
    };
    if (dialog?.mode === "create") {
      await createAssignment(command, sessionTokenProvider);
    } else if (dialog?.target) {
      await updateAssignment(
        { id: dialog.target.id, ...command },
        sessionTokenProvider,
      );
    }
    await refresh();
    setDialog(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteAssignment(deleteTarget.id, sessionTokenProvider);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteTarget(null);
      if (isApiError(error)) {
        if (error.status === 409 && error.problem.errorCode === "InUse") {
          setActionError(
            "This assignment has submissions and cannot be deleted.",
          );
          return;
        }
        if (error.status === 403) {
          setActionError("You can only delete your own assignments.");
          return;
        }
      }
      setActionError("Could not delete the assignment. Please try again.");
    }
  };

  const handlePublish = async (row: AssignmentResponse) => {
    setActionError(null);
    try {
      await publishAssignment(row.id, sessionTokenProvider);
      await refresh();
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 409 && error.problem.errorCode === "NotDraft") {
          setActionError("Only draft assignments can be published.");
          return;
        }
        if (error.status === 422) {
          setActionError("Cannot publish: the deadline is in the past.");
          return;
        }
        if (error.status === 403) {
          setActionError("You can only publish your own assignments.");
          return;
        }
      }
      setActionError("Could not publish the assignment. Please try again.");
    }
  };

  const columns: DataTableColumn<AssignmentResponse>[] = [
    {
      header: "Title",
      render: (row) => (
        <Link
          href={`/teacher/assignments/${row.id}/submissions`}
          className="font-medium text-accent transition-colors hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      header: "Subject",
      render: (row) => subjectById.get(row.subjectId)?.name ?? row.subjectId,
    },
    {
      header: "Deadline",
      render: (row) => new Date(row.deadline).toLocaleString(),
    },
    {
      header: "Max marks",
      render: (row) => row.maxMarks,
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === AssignmentStatus.Draft ? (
            <button
              type="button"
              onClick={() => handlePublish(row)}
              className="rounded-full px-3 py-1 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
            >
              Publish
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDialog({ mode: "edit", target: row })}
            className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-full px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const selectedClass = classId ? classById.get(classId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Assignments"
        description="Create and publish assignments for the classes you teach."
        action={
          <button
            type="button"
            disabled={!classId}
            onClick={() => setDialog({ mode: "create", target: null })}
            className="flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            New assignment
          </button>
        }
      />

      <ServerErrorBanner error={loadError} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="class-select"
          className="text-sm font-medium text-foreground"
        >
          Class
        </label>
        <select
          id="class-select"
          value={classId}
          disabled={refLoading}
          onChange={(e) => handleSelectClass(e.target.value)}
          className="max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="" disabled>
            {refLoading ? "Loading classes…" : "Select a class"}
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </div>
      ) : null}

      <ServerErrorBanner error={listError} />

      {!classId ? (
        <p className="text-sm text-muted">
          Select a class to see its assignments.
        </p>
      ) : listLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyState="No assignments for this class yet. Create the first one."
        />
      )}

      {dialog !== null && selectedClass ? (
        <AssignmentFormDialog
          mode={dialog.mode}
          initialValue={dialog.target}
          classId={selectedClass.id}
          className={classLabel(selectedClass)}
          subjects={subjects}
          onSubmit={handleSubmit}
          onCancel={() => setDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete assignment"
        message={`Delete "${deleteTarget?.title ?? ""}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
