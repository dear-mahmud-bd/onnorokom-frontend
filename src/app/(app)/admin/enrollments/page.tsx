"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
} from "@/lib/api/enrollments";
import { listClasses } from "@/lib/api/classes";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import { enrollmentSchema, type EnrollmentInput } from "@/lib/validation";
import type {
  ClassResponse,
  StudentClassEnrollmentResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

const EMPTY: EnrollmentInput = {
  studentId: "",
  classId: "",
};

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<StudentClassEnrollmentResponse[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<StudentClassEnrollmentResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<EnrollmentInput>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: EMPTY,
  });

  const refresh = useCallback(async () => {
    setRows(await listEnrollments({}, sessionTokenProvider));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [enrollments, classList] = await Promise.all([
          listEnrollments({}, sessionTokenProvider),
          listClasses(sessionTokenProvider),
        ]);
        if (active) {
          setRows(enrollments);
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

  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
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
      await createEnrollment(values, sessionTokenProvider);
      form.reset(EMPTY);
      await refresh();
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        switch (error.problem.errorCode) {
          case "StudentNotFound":
            form.setError("studentId", {
              message: "No student found for this id.",
            });
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
        setActionError("This student is already enrolled in that class.");
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
      await deleteEnrollment(deleteTarget.id, sessionTokenProvider);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteTarget(null);
      if (isApiError(error) && error.status === 404) {
        setActionError("This enrollment no longer exists.");
        return;
      }
      setActionError("Could not delete the enrollment. Please try again.");
    }
  };

  const columns: DataTableColumn<StudentClassEnrollmentResponse>[] = [
    {
      header: "Student",
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.studentId}</span>
      ),
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
        title="Enrollments"
        description="Enroll a student into a class."
      />

      <ServerErrorBanner error={loadError} />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <ServerErrorBanner error={serverError} />
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <AdminField
              name="studentId"
              label="Student ID"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
            {/* Student is entered as a GUID (from the user provisioning result)
                because the backend has no student-list endpoint yet. A proper
                picker needs GET /api/users?role=Student. */}
            <p className="-mt-2 text-xs text-muted">
              Paste a student&apos;s user id — a searchable picker awaits a
              backend student-list endpoint.
            </p>
            <AdminField
              name="classId"
              label="Class"
              variant="select"
              placeholder="Select a class"
              options={classOptions}
            />
            <div className="w-40">
              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                Add enrollment
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
          emptyState="No enrollments yet."
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete enrollment"
        message="Remove this student enrollment? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
