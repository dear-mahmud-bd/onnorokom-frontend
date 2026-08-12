"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  listTeacherAssignments,
} from "@/lib/api/teacherAssignments";
import { listSubjects } from "@/lib/api/subjects";
import { listClasses } from "@/lib/api/classes";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import {
  teacherAssignmentSchema,
  type TeacherAssignmentInput,
} from "@/lib/validation";
import type {
  ClassResponse,
  SubjectResponse,
  TeacherSubjectClassAssignmentResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

const EMPTY: TeacherAssignmentInput = {
  teacherId: "",
  subjectId: "",
  classId: "",
};

export default function AdminTeacherAssignmentsPage() {
  const [rows, setRows] = useState<TeacherSubjectClassAssignmentResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TeacherSubjectClassAssignmentResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<TeacherAssignmentInput>({
    resolver: zodResolver(teacherAssignmentSchema),
    defaultValues: EMPTY,
  });

  const refresh = useCallback(async () => {
    setRows(await listTeacherAssignments(undefined, sessionTokenProvider));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [assignments, subjectList, classList] = await Promise.all([
          listTeacherAssignments(undefined, sessionTokenProvider),
          listSubjects(sessionTokenProvider),
          listClasses(sessionTokenProvider),
        ]);
        if (active) {
          setRows(assignments);
          setSubjects(subjectList);
          setClasses(classList);
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
  }, []);

  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id })),
    [subjects],
  );
  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        label: `${c.name} — ${c.gradeLevel}`,
        value: c.id,
      })),
    [classes],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setActionError(null);
    try {
      await createTeacherAssignment(values, sessionTokenProvider);
      form.reset(EMPTY);
      await refresh();
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        switch (error.problem.errorCode) {
          case "TeacherNotFound":
            form.setError("teacherId", {
              message: "No teacher found for this id.",
            });
            return;
          case "SubjectNotFound":
            form.setError("subjectId", { message: "Subject not found." });
            return;
          case "ClassNotFound":
            form.setError("classId", { message: "Class not found." });
            return;
          default:
            break;
        }
      }
      if (
        isApiError(error) &&
        error.status === 409 &&
        error.problem.errorCode === "Duplicate"
      ) {
        setActionError(
          "This teacher is already assigned to that subject and class.",
        );
        return;
      }
      setServerError(error);
    }
  });

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteTeacherAssignment(deleteTarget.id, sessionTokenProvider);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteTarget(null);
      if (isApiError(error) && error.status === 404) {
        setActionError("This assignment no longer exists.");
        return;
      }
      setActionError("Could not delete the assignment. Please try again.");
    }
  };

  const columns: DataTableColumn<TeacherSubjectClassAssignmentResponse>[] = [
    {
      header: "Teacher",
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.teacherId}</span>
      ),
    },
    {
      header: "Subject",
      render: (row) => {
        const subject = subjectById.get(row.subjectId);
        return subject ? `${subject.name} (${subject.code})` : row.subjectId;
      },
    },
    {
      header: "Class",
      render: (row) => {
        const klass = classById.get(row.classId);
        return klass ? `${klass.name} — ${klass.gradeLevel}` : row.classId;
      },
    },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="rounded-full px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Teacher assignments"
        description="Assign a teacher to a subject and class."
      />

      <ServerErrorBanner error={loadError} />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <ServerErrorBanner error={serverError} />
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <AdminField
              name="teacherId"
              label="Teacher ID"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
            {/* Teacher is entered as a GUID (from the user provisioning result)
                because the backend has no teacher-list endpoint yet. A proper
                picker needs GET /api/users?role=Teacher. */}
            <p className="-mt-2 text-xs text-muted">
              Paste a teacher&apos;s user id — a searchable picker awaits a
              backend teacher-list endpoint.
            </p>
            <AdminField
              name="subjectId"
              label="Subject"
              variant="select"
              placeholder="Select a subject"
              options={subjectOptions}
            />
            <AdminField
              name="classId"
              label="Class"
              variant="select"
              placeholder="Select a class"
              options={classOptions}
            />
            <div className="w-40">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                Add assignment
              </SubmitButton>
            </div>
          </form>
        </FormProvider>
      </div>

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyState="No assignments yet."
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete assignment"
        message="Remove this teacher assignment? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
