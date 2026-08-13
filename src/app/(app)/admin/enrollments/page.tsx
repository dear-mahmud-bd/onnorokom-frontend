"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
} from "@/lib/api/enrollments";
import { listClasses } from "@/lib/api/classes";
import { listUsers } from "@/lib/api/users";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import { enrollmentSchema, type EnrollmentInput } from "@/lib/validation";
import {
  UserRole,
  type ClassResponse,
  type StudentClassEnrollmentResponse,
  type UserSummaryResponse,
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

// Shown in place of a dropdown when a cascading step has nothing selectable,
// keeping the labelled layout consistent with AdminField.
function FieldNotice({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        {children}
      </p>
    </div>
  );
}

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<StudentClassEnrollmentResponse[]>([]);
  const [students, setStudents] = useState<UserSummaryResponse[]>([]);
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
        const [enrollments, studentList, classList] = await Promise.all([
          listEnrollments({}, sessionTokenProvider),
          listUsers(sessionTokenProvider, UserRole.Student),
          listClasses(sessionTokenProvider),
        ]);
        if (active) {
          setRows(enrollments);
          setStudents(studentList);
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
  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );

  const studentLabel = useCallback(
    (student: UserSummaryResponse) => `${student.fullName} — ${student.email}`,
    [],
  );

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        label: `${c.name} — ${c.gradeLevel}`,
        value: c.id,
      })),
    [classes],
  );

  // Cascading Class -> Student. A student may belong to at most one class, so
  // once a class is chosen the Student picker only offers students who aren't
  // already enrolled anywhere (mirrors the backend AlreadyEnrolled guard).
  const selectedClassId = useWatch({ control: form.control, name: "classId" });
  const selectedStudentId = useWatch({ control: form.control, name: "studentId" });

  const enrolledStudentIds = useMemo(
    () => new Set(rows.map((r) => r.studentId)),
    [rows],
  );

  const availableStudents = useMemo(
    () => students.filter((s) => !enrolledStudentIds.has(s.id)),
    [students, enrolledStudentIds],
  );

  const studentOptions = useMemo(
    () => availableStudents.map((s) => ({ label: studentLabel(s), value: s.id })),
    [availableStudents, studentLabel],
  );

  // Drop a student selection that is no longer offered (e.g. after a refresh
  // shows them enrolled) so the form never submits a stale value.
  const availableStudentIds = useMemo(
    () => new Set(availableStudents.map((s) => s.id)),
    [availableStudents],
  );
  useEffect(() => {
    if (selectedStudentId && !availableStudentIds.has(selectedStudentId)) {
      form.setValue("studentId", "", { shouldValidate: false });
    }
  }, [selectedStudentId, availableStudentIds, form]);

  const canSubmit = Boolean(selectedClassId && selectedStudentId);

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
      if (isApiError(error) && error.status === 409) {
        setActionError(
          error.problem.errorCode === "AlreadyEnrolled"
            ? "This student already belongs to a class."
            : "This student is already enrolled in that class.",
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
      header: "Class",
      render: (row) => {
        const klass = classById.get(row.classId);
        return klass ? `${klass.name} — ${klass.gradeLevel}` : row.classId;
      },
    },
    {
      header: "Student",
      render: (row) => {
        const student = studentById.get(row.studentId);
        return student ? (
          studentLabel(student)
        ) : (
          <span className="font-mono text-xs text-muted">{row.studentId}</span>
        );
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
        description="Pick a class, then a student. Only students who don't yet belong to a class are offered."
      />

      <ServerErrorBanner error={loadError} />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <ServerErrorBanner error={serverError} />
        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {/* Step 1 — Class */}
            <AdminField
              name="classId"
              label="Class"
              variant="select"
              placeholder="Select a class"
              options={classOptions}
            />

            {/* Step 2 — Student (only those not yet in any class) */}
            {!selectedClassId ? (
              <AdminField
                name="studentId"
                label="Student"
                variant="select"
                placeholder="Select a class first"
                options={[]}
                disabled
              />
            ) : studentOptions.length === 0 ? (
              <FieldNotice label="Student">
                {students.length === 0
                  ? "No student accounts exist yet — provision a student first."
                  : "No students remaining — every student already belongs to a class."}
              </FieldNotice>
            ) : (
              <AdminField
                name="studentId"
                label="Student"
                variant="select"
                placeholder="Select a student"
                options={studentOptions}
              />
            )}

            <div className="w-40">
              <SubmitButton
                isSubmitting={form.formState.isSubmitting}
                disabled={!canSubmit}
              >
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
